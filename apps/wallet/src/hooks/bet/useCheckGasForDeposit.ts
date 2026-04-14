import { useQuery } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { isSolanaChain } from '@/helpers/isSolanaChain.js';
import { isLessThan, leftShift, minus, multipliedBy } from '@/helpers/number.js';
import { estimateSwapGas } from '@/helpers/swap/estimateSwapGas.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { useTokenBalance } from '@/hooks/useTokenBalance.js';
import type { CrossChainQuote, SwapQuote, SwapToken } from '@/providers/swap/types.js';

interface Options {
    depositToken: SwapToken | null;
    amount: string;
    quote?: CrossChainQuote | SwapQuote | null;
}

const defaultSolanaFee = 0.000013;

export function useCheckGasForDeposit({ depositToken, amount, quote }: Options) {
    const { evmAddress, solanaAddress } = useEmbeddedWalletAddresses();

    const isSolana = depositToken ? isSolanaChain(depositToken.chainId) : false;
    const isNativeToken = !depositToken
        ? false
        : depositToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
          depositToken.address === 'So11111111111111111111111111111111111111112';
    const walletAddress = !depositToken ? null : isSolana ? solanaAddress : evmAddress;
    const address = !depositToken
        ? undefined
        : isSolana
          ? '11111111111111111111111111111111'
          : '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
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

    return {
        isLoading: false,
        isInsufficientGas:
            !nativeToken || !usedFee || error
                ? false
                : isLessThan(minus(nativeToken.balance ?? '0', isNativeToken ? amount : 0), usedFee),
    };
}
