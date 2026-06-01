import { web3 } from '@coral-xyz/anchor';
import { STATUS } from '@dimensiondev/enums';
import { envs, SITE_URL } from '@dimensiondev/envs/web';
import { rightShift, toFixed } from '@dimensiondev/web3/numbers';
import type { FungibleToken } from '@dimensiondev/web3/types';
import { isZeroAddressSolana } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { BigNumber } from 'bignumber.js';
import { omit, pick } from 'lodash-es';
import { useContext } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { formatSenderName } from '@/components/RedPacket/helpers.js';
import {
    DEFAULT_THEME_ID,
    RED_PACKET_CONTRACT_VERSION,
    RED_PACKET_DURATION,
    RED_PACKET_MIN_SHARES,
} from '@/constants/rp.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getRpMaxShares } from '@/helpers/getRpLimitations.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import RedPacketIDL from '@/idls/redpacket.json' with { type: 'json' };
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { createCover } from '@/providers/firefly/red-packet/createCover.js';
import { getTokenAccountByMint } from '@/providers/solana/getTokenAccountByMint.js';
import { createWithNativeToken } from '@/providers/solana/red-packet/createWithNativeToken.js';
import { createWithSplToken } from '@/providers/solana/red-packet/createWithSplToken.js';
import type { CreateWithNativeTokenContext } from '@/providers/solana/red-packet/types.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { ClaimStrategy, RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { RedPacketMetadata } from '@/types/rp.js';

function treeShakePayloadInfo(payload: RedPacketJSONPayload): RedPacketMetadata {
    const token = pick(payload.token, ['decimals', 'symbol', 'address', 'chainId']) as FungibleToken<number, number>;
    return { ...omit(payload, ['block_number']), token } as RedPacketMetadata;
}

export function useSolanaCreateRedPacketCallback(
    shareFromName: string,
    publicKey: string,
    claimRequirements: ClaimStrategy[] | undefined,
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
    const message = originalMessage || t`Hope this sparks a smile.`;
    const maxShares = getRpMaxShares(networkType);

    return useAsyncFn(async () => {
        try {
            if (!token) throw new Error('Token is required.');
            if (!isNativeToken && !token.address) throw new Error('Token mint address is required.');
            if (shares < RED_PACKET_MIN_SHARES)
                throw new Error(`At least ${RED_PACKET_MIN_SHARES} person should be able to claim the lucky drop.`);
            if (shares > maxShares)
                throw new Error(`The number of people who can claim the lucky drop should be less than ${maxShares}.`);

            const baseParams: CreateWithNativeTokenContext = {
                owners: shares,
                totalAmount: BigNumber(totalAmount).toNumber(),
                duration: RED_PACKET_DURATION,
                ifSpiltRandom: randomType === 'random',
                publicKeyForClaimSignature: new web3.PublicKey(publicKey),
                message,
                authorDisplayName: shareFromName,
            };
            const password = '';
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
                network: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled ? 'devnet' : 'Solana',
                contract_address: RedPacketIDL.address,
                contract_version: RED_PACKET_CONTRACT_VERSION,
                txid: '',
                tokenProgram: '',
                themeId,
            };

            captureLuckyDropEvent('pre-create', {
                metadata: treeShakePayloadInfo(payload),
            });

            let result:
                | {
                      accountId: web3.PublicKey;
                      signature: string;
                  }
                | undefined;
            let tokenProgram: web3.PublicKey | undefined;
            if (isNativeToken) {
                result = await createWithNativeToken(baseParams);
            } else {
                const tokenAccount = await getTokenAccountByMint(chainId, account, token.address);
                if (!tokenAccount) throw new Error('Failed to get token account.');

                tokenProgram = tokenAccount.owner;
                result = await createWithSplToken({
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

            const metadata = treeShakePayloadInfo(payload);

            const { updateRpPayload } = useComposeStateStore.getState();

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
                publicKey,
                metadata,
            });

            enqueueSuccessMessage(t`Lucky drop created successfully`);
            const cover = await createCover(metadata);
            return cover.coverImageUrl;
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to create red packet`);
            throw error;
        }
    }, [
        token,
        isNativeToken,
        shares,
        maxShares,
        totalAmount,
        randomType,
        publicKey,
        message,
        shareFromName,
        account,
        total,
        themeId,
        claimRequirements,
        chainId,
    ]);
}
