import { sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { EMPTY_LIST } from '@/constants/index.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';
/**
 * Filters trade records within the date range of price records and without an
 * exact date match. Aligns their dates to the nearest price record date and
 * assigns the price from that record.
 */
export function useWithinRangeRecords(records: PriceRecord[], tradeRecords: TradeRecord[]) {
    return useMemo(() => {
        if (!tradeRecords.length || !records.length) return EMPTY_LIST;
        const min = records[0].date;
        const max = records[records.length - 1].date;

        const filtered = tradeRecords.filter((x) => x.date >= min && x.date <= max);
        const mergedDates = sortBy(
            [...records, ...filtered].map((x) => x.date),
            (x) => x,
        );

        filtered.forEach((x) => {
            const i = mergedDates.indexOf(x.date);
            const prev = mergedDates[i - 1] || mergedDates[0];
            const next = mergedDates[i + 1] || mergedDates[mergedDates.length - 1];
            const prevDelta = x.date - prev;
            const nextDelta = next - x.date;
            x.date = prevDelta < nextDelta ? prev : next;
            const record = records.find((y) => y.date === x.date);
            x.value = record?.value;
        });
        return sortBy(filtered, (x) => x.date);
    }, [records, tradeRecords]);
}
