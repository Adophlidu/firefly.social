import { EMPTY_LIST } from '@dimensiondev/constants';
import { t } from '@lingui/core/macro';
import { first, omit, pick } from 'lodash-es';
import { useContext, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import { type Address, decodeEventLog, encodeFunctionData, parseEventLogs } from 'viem';
import { getTransactionReceipt, writeContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { formatSenderName } from '@/components/RedPacket/helpers.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { DEFAULT_THEME_ID, RED_PACKET_CONTRACT_VERSION, RED_PACKET_DURATION } from '@/constants/rp.js';
import { SITE_URL } from '@/constants/static.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { rightShift, toFixed } from '@/helpers/number.js';
import { waitForEthereumTransaction } from '@/helpers/waitForEthereumTransaction.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { RedPacketContext } from '@/modals/RedPacketModal/RedPacketContext.js';
import { getEvmNativeTokenAddress } from '@/providers/ethereum/getNativeTokenAddress.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { createRedPacketParams } from '@/providers/ethereum/red-packet/createRedPacketParams.js';
import { FreeGasTxType, tryFreeGasTransaction } from '@/providers/firefly/freeGas/tryFreeGasTransaction.js';
import { createCover } from '@/providers/firefly/red-packet/createCover.js';
import { captureLuckyDropEvent } from '@/providers/telemetry/captureLuckyDropEvent.js';
import type { FireflyRedPacketAPI, RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { RedPacketCreationSuccessEventArgs, RedPacketMetadata } from '@/types/rp.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import type { FungibleToken } from '@/web3-shared/base/specs.js';
import { EthereumSchemaType } from '@/web3-shared/evm/types.js';

function treeShakePayloadInfo(payload: RedPacketJSONPayload): RedPacketMetadata {
    const token = pick(payload.token, ['decimals', 'symbol', 'address', 'chainId']) as FungibleToken<
        number,
        EthereumSchemaType.Native | EthereumSchemaType.ERC20
    >;
    return { ...omit(payload, ['block_number']), token } as RedPacketMetadata;
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
            message: message || t`Hope this sparks a smile.`,
            shares: shares || 0,
            token: token
                ? (omit(token, ['logoURI']) as FungibleToken<
                      number,
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

            const redpacketParams = await createRedPacketParams({
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
            if (!redpacketParams) return;
            const { params, methodParams } = redpacketParams;

            const value = toFixed(params.token?.schema === EthereumSchemaType.Native ? total : 0);

            const payload = {
                sender: {
                    address: account,
                    name: methodParams.name,
                    message: methodParams.message,
                },
                is_random: methodParams.isRandom,
                shares: methodParams.shares,
                password: '',
                rpid: '',
                total: methodParams.total,
                duration: methodParams.duration,
                creation_time: Date.now(),
                token,
                network: EVMChainResolver.chainName(chainId),
                chainId,
                contract_address: getRedPacketContractAddress(chainId),
                contract_version: RED_PACKET_CONTRACT_VERSION,
                txid: '',
            };

            captureLuckyDropEvent('pre-create', {
                metadata: treeShakePayloadInfo(payload),
            });

            const createRedPacketCalldata = encodeFunctionData({
                abi: RED_PACKET_ABI,
                functionName: 'create_red_packet',
                args: [
                    methodParams.publicKey,
                    methodParams.shares,
                    methodParams.isRandom,
                    methodParams.duration,
                    methodParams.seed,
                    methodParams.message,
                    methodParams.name,
                    methodParams.tokenType,
                    methodParams.tokenAddress,
                    methodParams.total,
                ],
            });

            // Try free-gas for red packet creation
            const freeGasResult = await tryFreeGasTransaction({
                chainId,
                txType: FreeGasTxType.RedpacketSend,
                from: account,
                to: getRedPacketContractAddress(chainId),
                data: createRedPacketCalldata,
                value: value !== '0' ? value : undefined,
                tokenAddress,
            });

            let result: `0x${string}`;
            if (freeGasResult.type === 'free-gas') {
                result = freeGasResult.hash as `0x${string}`;
            } else {
                result = await writeContract(wagmiConfig, {
                    address: getRedPacketContractAddress(chainId),
                    abi: RED_PACKET_ABI,
                    functionName: 'create_red_packet',
                    args: [
                        methodParams.publicKey,
                        methodParams.shares,
                        methodParams.isRandom,
                        methodParams.duration,
                        methodParams.seed,
                        methodParams.message,
                        methodParams.name,
                        methodParams.tokenType,
                        methodParams.tokenAddress,
                        methodParams.total,
                    ],
                    value: BigInt(value),
                    account: account as Address,
                    chainId,
                });
            }
            if (!result) return;

            await waitForEthereumTransaction(chainId, result);
            const receipt = await getTransactionReceipt(wagmiConfig, {
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

            const { id, creation_time } = args as unknown as RedPacketCreationSuccessEventArgs;
            if (!id) return;

            Object.assign(payload, {
                rpid: id as string,
                creation_time: Number.parseInt(creation_time, 10) * 1000,
                txid: receipt.transactionHash,
            });

            const metadata = treeShakePayloadInfo(payload);

            const { updateRpPayload } = useComposeStateStore.getState();

            captureLuckyDropEvent('create', {
                metadata,
            });

            updateRpPayload({
                payloadImage: coverImage,
                claimRequirements: claimRequirements ?? EMPTY_LIST,
                publicKey,
                metadata,
            });

            enqueueSuccessMessage(t`Lucky drop created successfully`);
            const cover = await createCover(metadata);
            return cover.coverImageUrl;
        } catch (error) {
            if (error instanceof Error) {
                enqueueMessageFromError(error, t`Failed to create red packet`);
            }
            throw error;
        }
    }, [redPacketSettings, chainId, account, publicKey, networkType, coverImage, claimRequirements]);
}
