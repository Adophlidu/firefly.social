import { useMemo } from 'react';

import { getOrderBookTickSteps } from '@/helpers/getOrderBookTickSteps';

export function useOrderBookSteps(midPrice: string, szDecimals: number) {
    return useMemo(
        () =>
            getOrderBookTickSteps({
                midPrice,
                szDecimals,
                isSpot: false,
            }),
        [midPrice, szDecimals],
    );
}
