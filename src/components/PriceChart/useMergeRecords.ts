import { sortBy } from 'lodash-es';
import { useMemo } from 'react';

import type { PriceRecord, TradeRecord } from '@/types/token.js';

/**
 * Merges trade records within the date range of the price records with the
 * price records.
 */
export function useMergeRecords(records: PriceRecord[], tradeRecords: TradeRecord[]): PriceRecord[] {
    return useMemo((): PriceRecord[] => {
        const min = records[0].date;
        const max = records[records.length - 1].date;

        const dateSet = new Set(records.map((x) => x.date));
        const withinRange = tradeRecords.filter((x) => x.date >= min && x.date <= max && !dateSet.has(x.date));
        if (!withinRange.length) return records;
        const merged = sortBy(
            [...records, ...tradeRecords.map((x) => ({ date: x.date, value: x.value }))],
            (x) => x.date,
        );
        return merged.filter((x): x is PriceRecord => typeof x.value === 'number');
    }, [records, tradeRecords]);
}
