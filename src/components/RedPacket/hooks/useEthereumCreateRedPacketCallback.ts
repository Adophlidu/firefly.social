import { t } from '@lingui/core/macro';
import { first, omit, pick } from 'lodash-es';
import { useContext, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import { type Address, decodeEventLog, parseEventLogs } from 'viem';
import { getTransactionReceipt, writeContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { config } from '@/configs/wagmiClient.js';
import { EMPTY_LIST, SITE_URL } from '@/constants/index.js';
import {
    DEFAULT_THEME_ID,
    RED_PACKET_CONTRACT_VERSION,
    RED_PACKET_DURATION,
    RedPacketMetaKey,
} from '@/constants/rp.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getTypedMessageRedPacket } from '@/helpers/getTypedMessage.js';
import { rightShift, toFixed } from '@/helpers/number.js';
import { getRpMetadata } from '@/helpers/rpPayload.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { EVMChainResolver } from '@/mask/index.js';
import type { FungibleToken } from '@/mask_pkgs/web3-shared/base/index.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { getEvmNativeTokenAddress } from '@/providers/ethereum/getNativeTokenAddress.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { EthereumRedPacket } from '@/providers/ethereum/RedPacket.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { FireflyRedPacketAPI, RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { EthereumChainId, EthereumSchemaType } from '#masknet/web3-shared-evm';

function reduceUselessPayloadInfo(payload: RedPacketJSONPayload): RedPacketJSONPayload {
    const token = pick(payload.token, ['decimals', 'symbol', 'address', 'chainId']) as FungibleToken<
        EthereumChainId,
        EthereumSchemaType.Native | EthereumSchemaType.ERC20
    >;
    return { ...omit(payload, ['block_number']), token };
}

export function useEthereumCreateRedPacketCallback(
    shareFromName: string,
    publicKey: string,
    claimRequirements?: FireflyRedPacketAPI.ClaimStrategy[],
) {
    const { randomType, message, shares, token, totalAmount, theme, networkType } = useContext(RedPacketContext);

    const redPacketSettings = useMemo(() => {
        return {
            duration: RED_PACKET_DURATION,
            isRandom: randomType === 'random',
            name: shareFromName,
            message: message || t`Best Wishes!`,
            shares: shares || 0,
            token: token
                ? (omit(token, ['logoURI']) as FungibleToken<
                      EthereumChainId,
                      EthereumSchemaType.ERC20 | EthereumSchemaType.Native
                  >)
                : undefined,
            total: rightShift(totalAmount, token?.decimals).toFixed(),
        };
    }, [message, randomType, shareFromName, shares, token, totalAmount]);

    const coverImage = useMemo(
        () =>
            urlcat(SITE_URL, '/api/rp', {
                'theme-id': theme?.tid ?? DEFAULT_THEME_ID,
                usage: 'payload',
                from: formatSenderName(shareFromName),
                amount: toFixed(rightShift(totalAmount, token?.decimals).toString()),
                type: 'fungible',
                symbol: token?.symbol,
                decimals: token?.decimals,
                message,
            }),
        [shareFromName, totalAmount, token?.decimals, token?.symbol, theme?.tid, message],
    );

    const { chainId, account } = useChainContext({ chainId: token.chainId, networkType });

    return useAsyncFn(async () => {
        try {
            if (!redPacketSettings) return;

            const { duration, isRandom, message, name: senderName, shares, total, token } = redPacketSettings;
            if (!token) return;

            const tokenAddress =
                token.schema === EthereumSchemaType.Native ? getEvmNativeTokenAddress(chainId) : token.address;
            if (!tokenAddress) return;

            const params = await EthereumRedPacket.createRedPacketParams({
                creator: account,
                duration,
                isRandom,
                message,
                name: senderName,
                shares,
                total,
                token,
                chainId,
                version: RED_PACKET_CONTRACT_VERSION,
                publicKey,
                networkType,
            });
            if (!params) return;

            const value = toFixed(params.params.token?.schema === EthereumSchemaType.Native ? total : 0);

            const result = await writeContract(config, {
                address: getRedPacketContractAddress(chainId),
                abi: RED_PACKET_ABI,
                functionName: 'create_red_packet',
                args: [
                    params.methodParams.publicKey,
                    params.methodParams.shares,
                    params.methodParams.isRandom,
                    params.methodParams.duration,
                    params.methodParams.seed,
                    params.methodParams.message,
                    params.methodParams.name,
                    params.methodParams.tokenType,
                    params.methodParams.tokenAddress,
                    params.methodParams.total,
                ],
                value: BigInt(value),
                account: account as Address,
                chainId,
            });
            if (!result) return;

            await waitForEthereumTransaction(chainId, result);
            const receipt = await getTransactionReceipt(config, {
                hash: result,
                chainId,
            });
            if (!receipt) return;

            const events = parseEventLogs({
                abi: RED_PACKET_ABI,
                eventName: 'CreationSuccess',
                logs: receipt.logs,
            });
            const item = first(events);
            if (!item) return;
            const { args } = decodeEventLog({
                abi: RED_PACKET_ABI,
                eventName: 'CreationSuccess',
                data: item.data,
                topics: item.topics,
            });
            if (!args) return;

            const {
                total: _total,
                id,
                name: _name,
                message: _message,
                duration: _duration,
                creation_time,
                ifrandom: _isRandom,
            } = args as unknown as {
                creation_time: string;
                creator: string;
                id: string;
                token_address: string;
                total: bigint;
                name: string;
                message: string;
                duration: number;
                ifrandom: boolean;
            };
            if (!id) return;

            const payload = {
                sender: {
                    address: account,
                    name: _name as string,
                    message: _message as string,
                },
                is_random: _isRandom,
                shares,
                password: '',
                rpid: id as string,
                total: _total.toString(),
                duration: Number(_duration) as number,
                creation_time: Number.parseInt(creation_time, 10) * 1000,
                token,
                network: EVMChainResolver.chainName(chainId),
                contract_address: getRedPacketContractAddress(chainId),
                contract_version: RED_PACKET_CONTRACT_VERSION,
                txid: receipt.transactionHash,
            };

            const typedMessage = getTypedMessageRedPacket({
                [RedPacketMetaKey]: reduceUselessPayloadInfo(payload),
            });

            const { updateTypedMessage, updateRpPayload } = useComposeStateStore.getState();

            updateTypedMessage(typedMessage);

            const metadata = getRpMetadata(typedMessage);
            if (metadata)
                captureLuckyDropEvent('create', {
                    metadata,
                });

            if (coverImage) {
                updateRpPayload({
                    payloadImage: coverImage,
                    claimRequirements: claimRequirements ?? EMPTY_LIST,
                    publicKey,
                });
            }

            enqueueSuccessMessage(t`Lucky drop created successfully`);
        } catch (error) {
            if (error instanceof Error) {
                enqueueMessageFromError(error, t`Failed to create red packet`);
            }
            throw error;
        }
    }, [redPacketSettings, publicKey, account, chainId, coverImage, claimRequirements, networkType]);
}
