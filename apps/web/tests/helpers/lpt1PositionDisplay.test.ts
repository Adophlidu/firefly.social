import { describe, expect, test } from 'vitest';

import type { Lpt1PositionOutput } from '@/helpers/lpt1.js';
import { resolvePositionMarketContext } from '@/helpers/prediction/lpt1PositionDisplay.js';

function makePosition(overrides: Partial<Lpt1PositionOutput> = {}): Lpt1PositionOutput {
    return {
        conditionId: '0xcond',
        outcome: '',
        outcomeIndex: 0,
        shares: 100,
        price: 0.5,
        ...overrides,
    };
}

const MARKETS = [
    {
        id: '111',
        conditionId: '0xaaa',
        title: 'Team to Advance',
        outcomes: [{ label: 'Argentina' }, { label: 'Switzerland' }],
    },
    {
        id: '222',
        conditionId: '0xbbb',
        title: 'Match Winner',
        outcomes: [{ label: 'Yes' }, { label: 'No' }],
    },
];

// 3-way moneyline with two 2-way legs nested under `originalMoneylineMarkets`.
// A tag-encoded position often carries a leg's marketId (e.g. '333a'), which is
// NOT a top-level entry — the helper must search the nested legs too.
const MERGED_MONEYLINE = [
    {
        id: '333',
        conditionId: '0xmerged',
        title: 'Argentina',
        groupItemTitle: 'Argentina',
        outcomes: [{ label: 'Argentina' }, { label: 'Draw' }, { label: 'Switzerland' }],
        originalMoneylineMarkets: [
            {
                id: '333a',
                conditionId: '0xleg-arg',
                title: 'Will Argentina win?',
                groupItemTitle: 'Argentina',
                outcomes: [{ label: 'Yes' }, { label: 'No' }],
            },
            {
                id: '333b',
                conditionId: '0xleg-sui',
                title: 'Will Switzerland win?',
                groupItemTitle: 'Switzerland',
                outcomes: [{ label: 'Yes' }, { label: 'No' }],
            },
        ],
    },
];

describe('resolvePositionMarketContext', () => {
    test('returns empty context when there are no markets', () => {
        expect(resolvePositionMarketContext(makePosition(), [])).toEqual({});
        expect(resolvePositionMarketContext(makePosition(), undefined)).toEqual({});
    });

    test('resolves market title + outcome label by conditionId (primary key)', () => {
        const pos = makePosition({ conditionId: '0xaaa', outcomeIndex: 1 });
        expect(resolvePositionMarketContext(pos, MARKETS)).toEqual({
            marketTitle: 'Team to Advance',
            outcomeLabel: 'Switzerland',
        });
    });

    test('resolves by marketId when conditionId is empty (tag-encoded positions)', () => {
        const pos = makePosition({ conditionId: '', marketId: '222', outcomeIndex: 0 });
        expect(resolvePositionMarketContext(pos, MARKETS)).toEqual({
            marketTitle: 'Match Winner',
            outcomeLabel: 'Yes',
        });
    });

    test('conditionId wins over marketId when both are present', () => {
        const pos = makePosition({ conditionId: '0xaaa', marketId: '222', outcomeIndex: 0 });
        expect(resolvePositionMarketContext(pos, MARKETS).marketTitle).toBe('Team to Advance');
    });

    test('skips conditionId lookup when it is empty (would otherwise match a blank conditionId)', () => {
        // marketId matches 222; conditionId '' must not short-circuit into a no-match.
        const pos = makePosition({ conditionId: '', marketId: '222', outcomeIndex: 1 });
        expect(resolvePositionMarketContext(pos, MARKETS).outcomeLabel).toBe('No');
    });

    test('returns empty context when neither key matches', () => {
        const pos = makePosition({ conditionId: '0xzzz', marketId: '999' });
        expect(resolvePositionMarketContext(pos, MARKETS)).toEqual({});
    });

    test('outcomeLabel is undefined when outcomeIndex is out of range', () => {
        const pos = makePosition({ conditionId: '0xaaa', outcomeIndex: 9 });
        expect(resolvePositionMarketContext(pos, MARKETS)).toEqual({
            marketTitle: 'Team to Advance',
            outcomeLabel: undefined,
        });
    });

    test('resolves a leg nested in originalMoneylineMarkets by marketId (tag-encoded leg)', () => {
        const pos = makePosition({ conditionId: '', marketId: '333a', outcomeIndex: 0 });
        expect(resolvePositionMarketContext(pos, MERGED_MONEYLINE)).toEqual({
            marketTitle: 'Argentina',
            outcomeLabel: 'Yes',
        });
    });

    test('resolves a nested leg by its own conditionId', () => {
        const pos = makePosition({ conditionId: '0xleg-sui', outcomeIndex: 0 });
        expect(resolvePositionMarketContext(pos, MERGED_MONEYLINE)).toEqual({
            marketTitle: 'Switzerland',
            outcomeLabel: 'Yes',
        });
    });

    test('prefers groupItemTitle over title for the market pill', () => {
        // 333a has title "Will Argentina win?" but groupItemTitle "Argentina".
        const pos = makePosition({ conditionId: '0xleg-arg', outcomeIndex: 1 });
        expect(resolvePositionMarketContext(pos, MERGED_MONEYLINE).marketTitle).toBe('Argentina');
        expect(resolvePositionMarketContext(pos, MERGED_MONEYLINE).outcomeLabel).toBe('No');
    });

    test('strips a trailing "(Home vs. Away)" qualifier from the title', () => {
        const markets = [
            {
                id: '444',
                conditionId: '0xdraw',
                title: 'Draw (Argentina vs. Switzerland)',
                outcomes: [{ label: 'Yes' }, { label: 'No' }],
            },
        ];
        const pos = makePosition({ conditionId: '0xdraw', outcomeIndex: 0 });
        expect(resolvePositionMarketContext(pos, markets).marketTitle).toBe('Draw');
    });
});
