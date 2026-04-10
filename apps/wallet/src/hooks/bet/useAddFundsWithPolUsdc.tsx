import { Trans } from '@lingui/react/macro';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useAsyncFn } from 'react-use';
import { toast } from 'sonner';
import { type Address, erc20Abi, parseUnits } from 'viem';
import { useConfig } from 'wagmi';
import { simulateContract, waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { queryClient } from '@/configs/queryClient.js';
import { InsufficientGasError } from '@/constants/error.js';
import { addAndSwitchChain } from '@/helpers/addAndSwitchChain.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { useEmbeddedEvmWalletContext } from '@/hooks/useCachedWalletAddresses.js';
import type { SwapToken } from '@/providers/swap/types.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

interface Options {
    depositToken?: SwapToken;
    polymarketAddress?: string;
    amount: string;
    toastId: string;
}

export function useAddFundsWithPolUsdc({ depositToken, polymarketAddress, amount, toastId }: Options) {
    const { wallet: embeddedWallet, address: embeddedAddress } = useEmbeddedEvmWalletContext();
    const { setActiveWallet } = useSetActiveWallet();
    const config = useConfig();

    return useAsyncFn(async () => {
        if (!embeddedWallet || !embeddedAddress) {
            throw new Error('Embedded wallet not ready');
        }
        if (!depositToken) {
            throw new Error('Deposit token not ready');
        }
        if (!polymarketAddress) {
            throw new Error('Polymarket address not ready');
        }

        await setActiveWallet(embeddedWallet);
        await queryClient.cancelQueries(getPolymarketAccountQueryOptions());
        const parsedValue = parseUnits(amount, depositToken.decimals);
        await addAndSwitchChain(config, depositToken.chainId);

        const transferCall = {
            abi: erc20Abi,
            address: depositToken.address as Address,
            functionName: 'transfer' as const,
            args: [polymarketAddress as Address, parsedValue] as const,
            chainId: depositToken.chainId,
        };

        let gas: bigint | undefined;
        try {
            const client = createWagmiPublicClient(depositToken.chainId);
            const estimated = await client.estimateContractGas({
                ...transferCall,
                account: embeddedAddress as Address,
            });
            gas = (estimated * 120n) / 100n;
        } catch {
            gas = undefined;
        }

        {
            const client = createWagmiPublicClient(depositToken.chainId);
            const gasLimit = gas;
            if (gasLimit) {
                const [gasPrice, nativeBalance] = await Promise.all([
                    client.getGasPrice(),
                    client.getBalance({ address: embeddedAddress as Address }),
                ]);
                const fee = gasLimit * gasPrice;
                if (nativeBalance < fee) {
                    throw new InsufficientGasError();
                }
            }
        }

        const { request } = await simulateContract(config, {
            ...transferCall,
            account: embeddedAddress as Address,
        });
        const txHash = await writeContract(config, {
            ...request,
            account: embeddedAddress as Address,
            gas: gas ?? request.gas,
        });
        toast.loading(<Trans>Your funds are on the way...</Trans>, { id: toastId });
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
    }, [amount, depositToken, polymarketAddress, config, embeddedWallet, embeddedAddress, toastId, setActiveWallet]);
}
