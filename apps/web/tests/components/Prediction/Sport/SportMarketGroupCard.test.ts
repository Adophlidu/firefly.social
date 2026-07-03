import { describe, expect, it } from 'vitest';

import { createSportLineOptions } from '@/components/Prediction/Sport/SportMarketGroupCard.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

/** Build a BetsMarketDataForUI with required fields pre-filled; override what matters. */
function mk(overrides: Partial<BetsMarketDataForUI>): BetsMarketDataForUI {
    return {
        id: 'id',
        conditionId: 'cond',
        questionId: 'id',
        title: '',
        volume: '0',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        outcomes: [],
        ...overrides,
    };
}

/**
 * Each spread market stores its OWN team's handicap (always <= 0). The side is encoded in the slug
 * ("-spread-home-Xpt5" / "-spread-away-Xpt5"), so an away-side -X market is the home team +X.
 */
const spread = (id: string, magnitude: number, side: 'home' | 'away') =>
    mk({ id, line: -magnitude, slug: `fifwc-x-che-2026-spread-${side}-${magnitude}pt5`, sportsMarketType: 'spreads' });

describe('createSportLineOptions — spread mirror ordering (FW-7839)', () => {
    it('orders by home-perspective handicap descending so the smallest magnitude sits in the middle', () => {
        // Mix insertion order; each magnitude has a home (-X) and away (home +X) market.
        const markets = [
            spread('h3', 3.5, 'home'),
            spread('a1', 1.5, 'away'),
            spread('h1', 1.5, 'home'),
            spread('a3', 3.5, 'away'),
            spread('h2', 2.5, 'home'),
            spread('a2', 2.5, 'away'),
        ];

        const options = createSportLineOptions(SportMarketGroupType.Spread, markets);

        // Descending home-perspective: +3.5 +2.5 +1.5 -1.5 -2.5 -3.5
        // → absolute labels mirror outward from the smallest: 3.5 2.5 1.5 1.5 2.5 3.5
        expect(options.map((o) => o.label)).toEqual(['3.5', '2.5', '1.5', '1.5', '2.5', '3.5']);
        // Away-side markets (home +X) come before their home-side twin (home -X) at each magnitude.
        expect(options.map((o) => o.key)).toEqual(['a3', 'a2', 'a1', 'h1', 'h2', 'h3']);
    });

    it('keeps distinct ids for the two sides of a magnitude', () => {
        const markets = [spread('h', 1.5, 'home'), spread('a', 1.5, 'away')];
        const options = createSportLineOptions(SportMarketGroupType.Spread, markets);

        // +1.5 (away) before -1.5 (home); both labelled "1.5".
        expect(options.map((o) => o.key)).toEqual(['a', 'h']);
        expect(options.map((o) => o.label)).toEqual(['1.5', '1.5']);
    });

    it('preserves the original sign when a market slug has no home/away segment', () => {
        // No -home-/-away- in the slug → treated as home-perspective (no flip), line stays -2.5.
        const markets = [mk({ id: 'x', line: -2.5, slug: 'fifwc-x-spread-2pt5', sportsMarketType: 'spreads' })];
        const options = createSportLineOptions(SportMarketGroupType.Spread, markets);
        expect(options.map((o) => o.label)).toEqual(['2.5']);
    });
});

describe('createSportLineOptions — totals keep label-ascending order', () => {
    it('sorts totals by numeric label ascending (no mirror)', () => {
        const markets = [
            mk({ id: 't3', line: 3.5, sportsMarketType: 'totals' }),
            mk({ id: 't1', line: 1.5, sportsMarketType: 'totals' }),
            mk({ id: 't2', line: 2.5, sportsMarketType: 'totals' }),
        ];
        const options = createSportLineOptions(SportMarketGroupType.Total, markets);
        expect(options.map((o) => o.label)).toEqual(['1.5', '2.5', '3.5']);
    });
});
