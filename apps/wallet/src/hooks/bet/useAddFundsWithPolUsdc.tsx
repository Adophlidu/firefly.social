import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { resolvePublicRpcUrl } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';
import { type Address, encodeFunctionData, erc20Abi, type Hash, parseUnits } from 'viem';
import { useConfig } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { queryClient } from '@/configs/queryClient.js';
import { InsufficientGasError } from '@/constants/error.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { resolveEvmConnector, switchEvmConnectorChain } from '@/helpers/resolveEvmConnector.js';
import { toastLoading } from '@/helpers/toastLoading.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

interface Options {
    depositToken?: SwapToken;
    polymarketAddress?: string;
    amount: string;
    toastId: string;
}

export function useAddFundsWithPolUsdc({ depositToken, polymarketAddress, amount, toastId }: Options) {
    const { address: embeddedAddress } = useEmbeddedEvmWalletContext();
    const config = useConfig();

    return useAsyncFn(async () => {
        if (!embeddedAddress) {
            throw new Error('Embedded wallet not ready');
        }
        if (!depositToken) {
            throw new Error('Deposit token not ready');
        }
        if (!polymarketAddress) {
            throw new Error('Polymarket address not ready');
        }

        await queryClient.cancelQueries(getPolymarketAccountQueryOptions());
        const parsedValue = parseUnits(amount, depositToken.decimals);
        const connector = await resolveEvmConnector(embeddedAddress, PRIVY_CONNECTOR_ID);
        if (connector) {
            await switchEvmConnectorChain(connector, depositToken.chainId);
        }

        const transferCall = {
            abi: erc20Abi,
            address: depositToken.address as Address,
            functionName: 'transfer' as const,
            args: [polymarketAddress as Address, parsedValue] as const,
            chainId: depositToken.chainId,
        };

        const { request } = await simulateContract(config, {
            ...transferCall,
            account: embeddedAddress as Address,
        });

        // Try free-gas for Polymarket deposit
        let txHash: Hash;
        const freeGasResult = await tryFreeGasTransaction({
            chainId: depositToken.chainId,
            txType: FreeGasTxType.PolymarketDeposit,
            from: embeddedAddress,
            to: depositToken.address as Address,
            data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [polymarketAddress as Address, parsedValue],
            }),
        });
        if (freeGasResult.type === 'free-gas') {
            txHash = freeGasResult.hash as Hash;
        } else {
            // Free-gas not available — verify user has enough native token to pay gas
            let gas: bigint | undefined;
            try {
                const client = createWagmiPublicClient(depositToken.chainId, resolvePublicRpcUrl(depositToken.chainId));
                const estimated = await client.estimateContractGas({
                    ...transferCall,
                    account: embeddedAddress as Address,
                });
                gas = (estimated * 120n) / 100n;
            } catch {
                gas = undefined;
            }

            if (gas) {
                const client = createWagmiPublicClient(depositToken.chainId, resolvePublicRpcUrl(depositToken.chainId));
                const [gasPrice, nativeBalance] = await Promise.all([
                    client.getGasPrice(),
                    client.getBalance({ address: embeddedAddress as Address }),
                ]);
                const fee = gas * gasPrice;
                if (nativeBalance < fee) {
                    throw new InsufficientGasError();
                }
            }

            txHash = await writeContract(config, {
                ...request,
                account: embeddedAddress as Address,
                gas: gas ?? request.gas,
            });
        }
        toastLoading(<Trans>Your funds are on the way...</Trans>, { id: toastId });
        await waitForTransactionReceipt(config, {
            hash: txHash,
            chainId: depositToken.chainId,
        });
        await getFireflyEndpoint().polymarketDepositUpload(
            polymarketAddress,
            embeddedAddress,
            parsedValue.toString(),
            txHash,
        );
        return polymarketAddress as Address;
    }, [amount, depositToken, polymarketAddress, config, embeddedAddress, toastId]);
}
