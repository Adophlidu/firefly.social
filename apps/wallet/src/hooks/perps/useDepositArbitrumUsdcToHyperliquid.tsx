import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { useConfig } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { InsufficientGasError } from '@/constants/error.js';
import {
    ARBITRUM_CHAIN_ID,
    ARBITRUM_USDC_ADDRESS,
    ARBITRUM_USDC_DECIMALS,
    HYPERLIQUID_DEPOSIT_ADDRESS,
    HYPERLIQUID_QUERY_KEY_ROOT,
} from '@/constants/hyperliquid.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { resolveEvmConnector, switchEvmConnectorChain } from '@/helpers/resolveEvmConnector.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { withSkipPinCodeCheck } from '@/helpers/withSkipPinCodeCheck.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';

interface Options {
    toastId: string;
    onSettled?: () => void;
}

export function useDepositArbitrumUsdcToHyperliquid({ toastId, onSettled }: Options) {
    const { address: embeddedAddress } = useEmbeddedEvmWalletContext();
    const wagmiConfig = useConfig();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (amount: string) =>
            withSkipPinCodeCheck(async () => {
                if (!embeddedAddress) {
                    throw new Error('Embedded wallet not ready');
                }

                const parsedValue = parseUnits(amount, ARBITRUM_USDC_DECIMALS);
                const connector = await resolveEvmConnector(embeddedAddress, PRIVY_CONNECTOR_ID);
                if (connector) {
                    await switchEvmConnectorChain(connector, ARBITRUM_CHAIN_ID);
                }

                const transferCall = {
                    abi: erc20Abi,
                    address: ARBITRUM_USDC_ADDRESS,
                    functionName: 'transfer' as const,
                    args: [HYPERLIQUID_DEPOSIT_ADDRESS, parsedValue] as const,
                    chainId: ARBITRUM_CHAIN_ID,
                };

                const { request } = await simulateContract(wagmiConfig, {
                    ...transferCall,
                    account: embeddedAddress as Address,
                });

                let txHash: Address;
                const freeGasResult = await tryFreeGasTransaction({
                    chainId: ARBITRUM_CHAIN_ID,
                    txType: FreeGasTxType.TokenTransfer,
                    from: embeddedAddress as Address,
                    to: ARBITRUM_USDC_ADDRESS,
                    tokenAddress: ARBITRUM_USDC_ADDRESS,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [HYPERLIQUID_DEPOSIT_ADDRESS, parsedValue],
                    }),
                });
                if (freeGasResult.type === 'free-gas') {
                    txHash = freeGasResult.hash as Address;
                } else {
                    let gas: bigint | undefined;
                    try {
                        const client = createWagmiPublicClient(
                            ARBITRUM_CHAIN_ID,
                            resolvePublicRpcUrl(ARBITRUM_CHAIN_ID),
                        );
                        const estimated = await client.estimateContractGas({
                            ...transferCall,
                            account: embeddedAddress as Address,
                        });
                        gas = (estimated * 120n) / 100n;
                    } catch {
                        gas = undefined;
                    }

                    if (gas) {
                        const client = createWagmiPublicClient(
                            ARBITRUM_CHAIN_ID,
                            resolvePublicRpcUrl(ARBITRUM_CHAIN_ID),
                        );
                        const [gasPrice, nativeBalance] = await Promise.all([
                            client.getGasPrice(),
                            client.getBalance({ address: embeddedAddress as Address }),
                        ]);
                        const fee = gas * gasPrice;
                        if (nativeBalance < fee) {
                            throw new InsufficientGasError();
                        }
                    }

                    txHash = await writeContract(wagmiConfig, {
                        ...request,
                        account: embeddedAddress as Address,
                        gas: gas ?? request.gas,
                    });
                }

                toastLoading(<Trans>Your funds are on the way...</Trans>, { id: toastId });
                await waitForTransactionReceipt(wagmiConfig, {
                    hash: txHash,
                    chainId: ARBITRUM_CHAIN_ID,
                });

                await queryClient.invalidateQueries({ queryKey: [HYPERLIQUID_QUERY_KEY_ROOT] });
                await queryClient.invalidateQueries({ queryKey: ['token-balance'] });

                return txHash;
            }),
        onSettled,
    });
}
