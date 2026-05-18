import { SwapFromPage } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

function resolveBackPath(from?: SwapFromPage): string {
    if (!from) return '/swap';

    switch (from) {
        case SwapFromPage.Swap:
            return '/swap';
        case SwapFromPage.BetWithdraw:
            return '/bet/withdraw';
        case SwapFromPage.BetDeposit:
            return '/bet/deposit';
        default:
            safeUnreachable(from);
            return '/swap';
    }
}

export function useGoBackAfterSelectToken(from?: SwapFromPage) {
    const navigate = useNavigate();

    return useCallback(
        (token?: { address: string; chainId: number }) => {
            navigate({
                to: resolveBackPath(from),
                search: token || undefined,
                replace: true,
            });
        },
        [from, navigate],
    );
}
