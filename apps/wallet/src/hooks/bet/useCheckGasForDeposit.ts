import { isSolanaChain } from '@dimensiondev/web3/chains';
import { ETH_NATIVE_TOKEN_ADDRESS, SOL_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3/constants';
import { isLessThan, leftShift, minus, multipliedBy } from '@dimensiondev/web3/numbers';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { checkFreeGasEligibility } from '@/helpers/freeGas/checkFreeGasEligibility.js';
import { estimateSwapGas } from '@/helpers/swap/estimateSwapGas.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import type { CrossChainQuote, SwapQuote, SwapToken } from '@/providers/swap/types.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';

interface Options {
    depositToken: SwapToken | null;
    amount: string;
    quote?: CrossChainQuote | SwapQuote | null;
}

const defaultSolanaFee = 0.000013;

export function useCheckGasForDeposit({ depositToken, amount, quote }: Options) {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();

    const isSolana = depositToken ? isSolanaChain(depositToken.chainId) : false;
    const isNativeToken = !depositToken ? false : isNativeTokenAddress(depositToken.address);
    const walletAddress = !depositToken ? null : isSolana ? solanaAddress : evmAddress;
    const address = !depositToken ? undefined : isSolana ? SOL_NATIVE_TOKEN_ADDRESS : ETH_NATIVE_TOKEN_ADDRESS;
    const { data: nativeToken } = useTokenBalance({
        walletAddress,
        address,
        chainId: depositToken?.chainId,
        refetchInterval: 1000 * 60, // 60 seconds
    });
    const { data: fee, error } = useQuery({
        queryKey: [
            'deposit-gas',
            depositToken?.chainId,
            quote?.tx?.to,
            quote?.tx?.data,
            quote?.tx?.value,
            walletAddress,
        ],
        staleTime: 1000 * 60, // 60 seconds
        refetchInterval: 1000 * 60, // 60 seconds
        enabled: !!depositToken && !!walletAddress && !isSolana && !!quote?.tx && !!nativeToken,
        queryFn: async () => {
            if (!depositToken || !walletAddress || isSolana || !quote?.tx || !nativeToken) return null;

            const client = createWagmiPublicClient(depositToken.chainId);
            const [gas, gasPrice] = await Promise.all([
                estimateSwapGas({
                    chainId: depositToken.chainId,
                    to: quote.tx.to as Address,
                    data: quote.tx.data as Hex,
                    value: BigInt(quote.tx.value || '0'),
                    account: walletAddress as Address,
                }),
                client.getGasPrice(),
            ]);

            return leftShift(multipliedBy(gas, gasPrice), nativeToken.decimals);
        },
    });

    const usedFee = isSolana ? defaultSolanaFee : fee;

    const isInsufficient =
        !!nativeToken &&
        !!usedFee &&
        !error &&
        isLessThan(minus(nativeToken.balance ?? '0', isNativeToken ? amount : 0), usedFee);

    const { data: isFreeGasEligible, isLoading: isFreeGasCheckLoading } = useQuery({
        queryKey: ['deposit-free-gas-check', depositToken?.chainId, quote?.tx?.to],
        enabled: isInsufficient && !!depositToken && !!quote?.tx?.to,
        staleTime: 1000 * 60,
        refetchInterval: 1000 * 60,
        retry: 0,
        queryFn: async () => {
            if (!depositToken || !quote?.tx?.to) return false;
            return checkFreeGasEligibility({
                chainId: depositToken.chainId,
                txType: FreeGasTxType.PolymarketDeposit,
                to: quote.tx.to,
            });
        },
    });

    return {
        isLoading: isFreeGasCheckLoading,
        isInsufficientGas: isInsufficient && isFreeGasEligible === false,
    };
}
