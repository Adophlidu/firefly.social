import { first, last } from 'lodash-es';
import { useMemo } from 'react';

import { type PriceRecord } from '@/types/token.js';

export function useIsPriceUp(stats: PriceRecord[], activeRecord?: PriceRecord) {
    return useMemo(() => {
        if (!stats.length) return { isUp: undefined, change: undefined };
        const startPrice = first(stats)?.value ?? 0;
        const endPrice = activeRecord?.value ?? last(stats)?.value ?? 0;
        const isUp = endPrice > startPrice;
        const change = ((endPrice - startPrice) / startPrice) * 100;
        return { isUp, change };
    }, [stats, activeRecord]);
}
