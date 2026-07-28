import { SwapFromPage } from '@dimensiondev/enums';
import { useNavigate } from '@dimensiondev/ssr';
import { safeUnreachable } from '@dimensiondev/utils';
import { useCallback } from 'react';

import { stringifySearch } from '@/helpers/searchParams.js';

function resolveBackPath(from?: SwapFromPage): string {
    if (!from) return '/swap';

    switch (from) {
        case SwapFromPage.Swap:
            return '/swap';
        case SwapFromPage.BetWithdraw:
            return '/bet/withdraw';
        case SwapFromPage.BetDeposit:
            return '/bet/deposit';
        case SwapFromPage.PerpsDeposit:
            return '/perps/deposit';
        default:
            safeUnreachable(from);
            return '/swap';
    }
}

export function useGoBackAfterSelectToken(from?: SwapFromPage) {
    const navigate = useNavigate();

    return useCallback(
        (token?: { address: string; chainId: number }) => {
            navigate(`${resolveBackPath(from)}${stringifySearch(token)}`, { replace: true });
        },
        [from, navigate],
    );
}
