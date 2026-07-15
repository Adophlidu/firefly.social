import { describe, expect, it } from 'vitest';

import { selectPolymarketListMarketsForDisplay } from '@/helpers/prediction/selectPolymarketListMarketsForDisplay.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

function market(
    overrides: Partial<BetsMarketDataForUI> & { id: string; prices?: [string, string] },
): BetsMarketDataForUI {
    const { prices = ['0.5', '0.5'], id, ...rest } = overrides;
    return {
        id,
        conditionId: '',
        questionId: '',
        title: id,
        volume: '',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        outcomes: [
            { id: `${id}-0`, label: 'Yes', price: prices[0] },
            { id: `${id}-1`, label: 'No', price: prices[1] },
        ],
        ...rest,
    };
}

describe('selectPolymarketListMarketsForDisplay', () => {
    it('returns the single market unchanged when there is only one', () => {
        const only = market({ id: 's', prices: ['0.6', '0.4'] });
        expect(selectPolymarketListMarketsForDisplay([only], undefined, 2)).toEqual([only]);
    });

    it('returns the top-N eligible markets by win-rate when enough are eligible', () => {
        const a = market({ id: 'a', prices: ['0.6', '0.4'] }); // 60%
        const b = market({ id: 'b', prices: ['0.3', '0.7'] }); // 30%
        const c = market({ id: 'c', prices: ['0.2', '0.8'] }); // 20%
        const selected = selectPolymarketListMarketsForDisplay([a, b, c], undefined, 2);
        expect(selected.map((m) => m.id)).toEqual(['a', 'b']);
    });

    it('excludes a decided (>=100%) market from the eligible set', () => {
        const a = market({ id: 'a', prices: ['0.6', '0.4'] });
        const decided = market({ id: 'decided', prices: ['1', '0'] }); // 100% — must be excluded
        const selected = selectPolymarketListMarketsForDisplay([a, decided], undefined, 2);
        expect(selected.map((m) => m.id)).toEqual(['a']);
    });

    // When fewer than `limit` markets are eligible, the fallback that backfills the cell must also
    // skip decided markets — otherwise a multi-market cell renders a meaningless 100% row.
    it('fallback never backfills with a decided (100%) market', () => {
        const a = market({ id: 'a', prices: ['0.6', '0.4'] }); // the only eligible market
        const decided1 = market({ id: 'decided1', prices: ['1', '0'] }); // 100%, active, unresolved
        const decided2 = market({ id: 'decided2', prices: ['1', '0'] }); // 100%, active, unresolved
        const selected = selectPolymarketListMarketsForDisplay([a, decided1, decided2], undefined, 2);
        expect(selected.map((m) => m.id)).toEqual(['a']);
        expect(selected).not.toContain(decided1);
        expect(selected).not.toContain(decided2);
    });

    it('fallback can backfill with a still-tradable (non-decided) market when eligible is short', () => {
        const a = market({ id: 'a', prices: ['0.6', '0.4'] }); // eligible
        const b = market({ id: 'b', prices: ['0.45', '0.55'] }); // eligible too — but forces multi path
        // Two eligible markets, limit 2 → both returned in order.
        const selected = selectPolymarketListMarketsForDisplay([a, b], undefined, 2);
        expect(selected.map((m) => m.id)).toEqual(['a', 'b']);
    });

    it('falls back to an inactive market only when nothing else is available (active !== false preferred)', () => {
        const a = market({ id: 'a', prices: ['0.6', '0.4'] });
        const inactive = market({ id: 'inactive', prices: ['0.4', '0.6'], active: false });
        // a is eligible; inactive is not (active === false). Fallback also requires active !== false.
        const selected = selectPolymarketListMarketsForDisplay([a, inactive], undefined, 2);
        expect(selected.map((m) => m.id)).toEqual(['a']);
    });
});
