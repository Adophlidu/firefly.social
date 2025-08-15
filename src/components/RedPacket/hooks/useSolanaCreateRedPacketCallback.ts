import { web3 } from '@coral-xyz/anchor';
import { t } from '@lingui/core/macro';
import type { TypedMessageTextV1 } from '@masknet/typed-message';
import { BigNumber } from 'bignumber.js';
import { omit, pick } from 'lodash-es';
import { useContext } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SITE_URL } from '@/constants/index.js';
import {
    DEFAULT_THEME_ID,
    RED_PACKET_CONTRACT_VERSION,
    RED_PACKET_DURATION,
    RED_PACKET_MIN_SHARES,
    SolanaRedPacketMetaKey,
} from '@/constants/rp.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getRpMaxShares } from '@/helpers/getRpLimitations.js';
import { getTypedMessageRedPacket } from '@/helpers/getTypedMessage.js';
import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { rightShift, toFixed } from '@/helpers/number.js';
import { getRpMetadata } from '@/helpers/rpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };
import type { FungibleToken } from '@/mask_pkgs/web3-shared/base/index.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { getTokenAccountByMint } from '@/providers/solana/getTokenAccountByMint.js';
import { type CreateWithNativeTokenContext, SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { FireflyRedPacketAPI, RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

function reduceUselessPayloadInfo(payload: RedPacketJSONPayload): RedPacketJSONPayload {
    const token = pick(payload.token, ['decimals', 'symbol', 'address', 'chainId']) as FungibleToken<number, number>;
    return { ...omit(payload, ['block_number']), token };
}

export function useSolanaCreateRedPacketCallback(
    shareFromName: string,
    claimRequirements?: FireflyRedPacketAPI.ClaimStrategy[],
) {
    const {
        randomType,
        message: originalMessage,
        shares,
        token,
        totalAmount,
        theme,
        networkType,
    } = useContext(RedPacketContext);
    const { chainId, account } = useChainContext({ chainId: token.chainId, networkType });

    const isNativeToken = isZeroAddressSolana(token.address);
    const total = rightShift(totalAmount, token?.decimals);
    const themeId = theme?.tid ?? DEFAULT_THEME_ID;
    const message = originalMessage || t`Best Wishes!`;
    const maxShares = getRpMaxShares(networkType);

    return useAsyncFn(async () => {
        try {
            if (!token) throw new Error('Token is required.');
            if (!isNativeToken && !token.address) throw new Error('Token mint address is required.');
            if (shares < RED_PACKET_MIN_SHARES)
                throw new Error(`At least ${RED_PACKET_MIN_SHARES} person should be able to claim the lucky drop.`);
            if (shares > maxShares)
                throw new Error(`The number of people who can claim the lucky drop should be less than ${maxShares}.`);

            const claimer = web3.Keypair.generate();
            const baseParams: CreateWithNativeTokenContext = {
                owners: shares,
                totalAmount: BigNumber(totalAmount).toNumber(),
                duration: RED_PACKET_DURATION,
                ifSpiltRandom: randomType === 'random',
                publicKeyForClaimSignature: claimer.publicKey,
                message,
                authorDisplayName: shareFromName,
            };
            const password = Buffer.from(claimer.secretKey).toString('hex');
            const payload = {
                sender: {
                    address: account,
                    name: shareFromName,
                    message,
                },
                is_random: randomType === 'random',
                shares,
                password,
                rpid: '',
                total: total.toString(),
                duration: baseParams.duration,
                creation_time: Date.now(),
                token,
                network: env.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? 'devnet' : 'mainnet-beta',
                contract_address: RedPacketIDL.address,
                contract_version: RED_PACKET_CONTRACT_VERSION,
                txid: '',
                tokenProgram: '',
                themeId,
            };

            captureLuckyDropEvent('pre-create', {
                metadata: getRpMetadata(
                    getTypedMessageRedPacket({
                        [SolanaRedPacketMetaKey]: reduceUselessPayloadInfo(payload),
                    }),
                ),
            });

            let result:
                | {
                      accountId: web3.PublicKey;
                      signature: string;
                  }
                | undefined;
            let tokenProgram: web3.PublicKey | undefined;
            if (isNativeToken) {
                result = await SolanaRedPacket.createWithNativeToken(baseParams);
            } else {
                const tokenAccount = await getTokenAccountByMint(chainId, account, token.address);
                if (!tokenAccount) throw new Error('Failed to get token account.');

                tokenProgram = tokenAccount.owner;
                result = await SolanaRedPacket.createWithSplToken({
                    ...baseParams,
                    totalAmount: total.toNumber(),
                    tokenMint: new web3.PublicKey(token.address),
                    tokenProgram: tokenAccount.owner,
                    tokenAccount: tokenAccount.pubkey,
                });
            }

            if (!result) throw new Error('Failed to create red packet.');

            Object.assign(payload, {
                rpid: result.accountId.toBase58(),
                txid: result.signature,
                tokenProgram: tokenProgram?.toBase58(),
            });

            const typedMessage = getTypedMessageRedPacket({
                [SolanaRedPacketMetaKey]: reduceUselessPayloadInfo(payload),
            });

            const { updateTypedMessage, updateRpPayload } = useComposeStateStore.getState();

            updateTypedMessage(typedMessage as TypedMessageTextV1);

            const metadata = getRpMetadata(typedMessage);
            if (metadata)
                captureLuckyDropEvent('create', {
                    metadata,
                });

            updateRpPayload({
                payloadImage: urlcat(SITE_URL, '/api/rp', {
                    'theme-id': themeId,
                    usage: 'payload',
                    from: formatSenderName(shareFromName),
                    amount: toFixed(total.toString()),
                    type: 'fungible',
                    symbol: token?.symbol,
                    decimals: token?.decimals,
                    message,
                }),
                claimRequirements: claimRequirements ?? [],
                publicKey: claimer.publicKey.toBase58(),
            });

            enqueueSuccessMessage(t`Lucky drop created successfully`);
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to create red packet`);
            throw error;
        }
    }, [
        shares,
        token,
        isNativeToken,
        randomType,
        message,
        shareFromName,
        account,
        chainId,
        totalAmount,
        claimRequirements,
        total,
        themeId,
        maxShares,
    ]);
}
