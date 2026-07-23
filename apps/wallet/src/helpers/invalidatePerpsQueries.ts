import { perpsQueryKeys } from '@dimensiondev/perps-react';
import type { QueryClient } from '@tanstack/react-query';

import { HYPERLIQUID_QUERY_KEY_ROOT } from '@/constants/hyperliquid.js';

/**
 * Refreshes balance data after a deposit or withdrawal settles.
 */
export function invalidatePerpsQueries(
    queryClient: QueryClient,
    { includeTokenBalance = false }: { includeTokenBalance?: boolean } = {},
) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: [HYPERLIQUID_QUERY_KEY_ROOT] }),
        queryClient.invalidateQueries({ queryKey: [...perpsQueryKeys.all, 'account'] }),
        queryClient.invalidateQueries({ queryKey: [...perpsQueryKeys.all, 'spot-account'] }),
        ...(includeTokenBalance ? [queryClient.invalidateQueries({ queryKey: ['token-balance'] })] : []),
    ]);
}
