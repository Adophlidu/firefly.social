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
        const merged = sortBy([...records, ...filtered.map((x) => ({ ...x, value: undefined }))], (x) => x.date);

        filtered.forEach((x) => {
            const i = merged.findIndex((y) => y.date === x.date);
            const leftHalf = merged.slice(0, i);
            x.date = (leftHalf.findLast((x) => x.value !== undefined) || merged[0]).date;
            const record = records.find((y) => y.date === x.date);
            x.value = record?.value;
        });
        return sortBy(filtered, (x) => x.date);
    }, [records, tradeRecords]);
}
