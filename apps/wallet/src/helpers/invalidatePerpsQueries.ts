import { perpsQueryKeys } from '@dimensiondev/perps-react';
import type { QueryClient } from '@tanstack/react-query';

import { HYPERLIQUID_QUERY_KEY_ROOT } from '@/constants/hyperliquid.js';

/**
 * Invalidates every Hyperliquid/perps query cache after a perps mutation settles.
 * Deposits also move the wallet's on-chain token balances, so pass
 * `includeTokenBalance` for deposit flows.
 */
export function invalidatePerpsQueries(
    queryClient: QueryClient,
    { includeTokenBalance = false }: { includeTokenBalance?: boolean } = {},
) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: [HYPERLIQUID_QUERY_KEY_ROOT] }),
        queryClient.invalidateQueries({ queryKey: perpsQueryKeys.all }),
        ...(includeTokenBalance ? [queryClient.invalidateQueries({ queryKey: ['token-balance'] })] : []),
    ]);
}
