import { sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { EMPTY_LIST } from '@/constants/index.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

/**
 * Filters trade records within the date range of price records and without an
 * exact date match. Aligns their dates to the nearest price record date and
 * assigns the price from that record.
 */
export function useWithinRangeRecords(
    records: PriceRecord[],
    tradeRecords: TradeRecord[],
    direction: TradeRecord['type'] | undefined,
    skipFilter?: boolean,
) {
    return useMemo(() => {
        const filteredTradeRecords = direction ? tradeRecords.filter((x) => x.type === direction) : tradeRecords;
        if (!filteredTradeRecords.length || !records.length) return EMPTY_LIST;
        const min = records[0].date;
        const max = records[records.length - 1].date;

        const filtered = skipFilter
            ? filteredTradeRecords
            : filteredTradeRecords.filter((x) => x.date >= min && x.date <= max);
        const merged = sortBy([...records, ...filtered.map((x) => ({ ...x, value: undefined }))], (x) => x.date);

        if (!filtered.length) return EMPTY_LIST;

        const patched = filtered.map((x) => {
            const i = merged.findIndex((y) => y.date === x.date);
            const leftHalf = merged.slice(0, i);
            const recordDate = (leftHalf.findLast((x) => x.value !== undefined) || records[0]).date;
            const record = records.find((y) => y.date === recordDate);

            return {
                ...x,
                date: recordDate,
                value: record?.value,
            };
        });
        return sortBy(patched, (x) => x.date);
    }, [records, skipFilter, tradeRecords, direction]);
}
