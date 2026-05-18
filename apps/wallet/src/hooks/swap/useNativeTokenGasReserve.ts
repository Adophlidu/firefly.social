import { isSolanaChain } from '@dimensiondev/web3/chains';
import { leftShift, multipliedBy, toFixed } from '@dimensiondev/web3/numbers';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { estimateFeesPerGas } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import type { SwapToken } from '@/providers/swap/types.js';

const EVM_GAS_LIMIT = 350_000n;
const GAS_BUFFER = 1.3;
const SOLANA_GAS_RESERVE = '0.00005';

export function useNativeTokenGasReserve(
    token: SwapToken | null,
    chainId: number | null,
): { gasReserve: string | null; isLoading: boolean } {
    const isNative = token ? isNativeTokenAddress(token.address) : false;

    const { data, isLoading } = useQuery({
        queryKey: ['native-gas-reserve', chainId],
        queryFn: async (): Promise<string | null> => {
            if (!token || !chainId || !isNative) return null;

            // Solana: fixed conservative estimate
            if (isSolanaChain(chainId)) return SOLANA_GAS_RESERVE;

            // EVM: estimate from network
            try {
                const feeData = await estimateFeesPerGas(config, { chainId });
                const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;
                if (!gasPrice) return '0';
                const gasCostWei = gasPrice * EVM_GAS_LIMIT;
                const inTokenUnits = leftShift(gasCostWei.toString(), token.decimals);
                return toFixed(multipliedBy(inTokenUnits, GAS_BUFFER), token.decimals);
            } catch {
                return '0';
            }
        },
        enabled: !!token && !!chainId && isNative,
        staleTime: 30_000,
    });

    if (!isNative) return { gasReserve: null, isLoading: false };
    return { gasReserve: data ?? null, isLoading };
}
