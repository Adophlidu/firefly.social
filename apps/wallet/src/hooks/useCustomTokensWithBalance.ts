import { useQueries } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { formatCustomTokenToTokenAsset } from '@/helpers/formatCustomTokenToTokenAsset.js';
import { getBalanceOf } from '@/helpers/getBalanceOf.js';
import { useCachedEvmAddress } from '@/hooks/useCachedWalletAddresses.js';
import { logger } from '@/lib/Logger.js';
import { type TokenAsset } from '@/providers/types/Firefly.js';
import { customTokensAtom, CustomTokenType, type ERC20Token } from '@/store/customToken.js';

/**
 * Hook to fetch custom ERC20 tokens with their balances
 * Returns TokenAsset format with actual balance queried from the blockchain
 */
export function useCustomTokensWithBalance(): {
    data: TokenAsset[];
    isLoading: boolean;
} {
    const evmAddress = useCachedEvmAddress();
    const customTokens = useAtomValue(customTokensAtom);

    // Filter only ERC20 tokens
    const erc20Tokens = customTokens.filter((token) => token.type === CustomTokenType.ERC20) as ERC20Token[];

    // Query balances for all custom tokens
    const balanceQueries = useQueries({
        queries: erc20Tokens.map((token) => ({
            queryKey: [
                'custom-token-balance',
                token.chainId,
                token.address.toLowerCase(),
                evmAddress?.toLowerCase() ?? '',
            ],
            queryFn: async () => {
                if (!evmAddress) return '0';

                try {
                    const balance = await getBalanceOf(token.chainId, evmAddress, token.address);
                    return balance.value.toString();
                } catch (error) {
                    logger.error(
                        `Failed to query balance for token ${token.address} on chain ${token.chainId}:`,
                        error,
                    );
                    return '0';
                }
            },
            enabled: !!evmAddress && !!token.address,
            staleTime: 1000 * 60, // 1 minute
        })),
    });

    const tokenAssets: TokenAsset[] = erc20Tokens.map((token, index) => {
        const balance = balanceQueries[index]?.data ?? '0';
        const tokenAsset = formatCustomTokenToTokenAsset(token, evmAddress || '');
        return {
            ...tokenAsset,
            balance,
        };
    });

    const isLoading = balanceQueries.some((query) => query.isLoading);

    return {
        data: tokenAssets,
        isLoading,
    };
}
