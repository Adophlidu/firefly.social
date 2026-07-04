import { PredictionPlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { compactEventForPageTransfer } from '@/helpers/compactEventForPageTransfer.js';
import type { BetsEventDataForUI, BetsMarketDataForUI } from '@/types/prediction.js';

function createMarket(
    id: string,
    sportsMarketType: string,
    overrides: Partial<BetsMarketDataForUI> = {},
): BetsMarketDataForUI {
    return {
        id,
        conditionId: `condition-${id}`,
        questionId: `question-${id}`,
        title: `Market ${id}`,
        volume: '1000',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        outcomes: [],
        sportsMarketType,
        question: `Question ${id}`,
        slug: `market-${id}`,
        groupItemTitle: `Group ${id}`,
        ...overrides,
    };
}

function createSportEvent(markets: BetsMarketDataForUI[]): BetsEventDataForUI {
    return {
        id: 'event-1',
        title: 'Test Event',
        endTime: 0,
        isSingleEvent: false,
        platform: PredictionPlatform.Polymarket,
        status: 'active',
        volume: '1000',
        slug: 'test-event',
        sportData: {
            gameId: 1,
            live: false,
            ended: false,
            homeTeam: { name: 'Home' },
            awayTeam: { name: 'Away' },
            scores: [],
            scoreType: 1,
            isDraw: false,
        },
        markets,
    };
}

describe('compactEventForPageTransfer', () => {
    it('keeps game-line sport markets and drops dedicated-tab player props', () => {
        const event = createSportEvent([
            createMarket('moneyline', 'moneyline'),
            createMarket('spread', 'spreads', { line: -1.5 }),
            createMarket('goal-prop', 'soccer_player_goals', { groupItemTitle: 'Player goals' }),
        ]);

        const compacted = compactEventForPageTransfer(event);

        expect(compacted.markets.map((market) => market.id)).toEqual(['moneyline', 'spread']);
        expect(compacted.markets[0]?.question).toBeUndefined();
        expect(compacted.markets[0]?.slug).toBeUndefined();
        expect(compacted.markets[0]?.groupItemTitle).toBe('Group moneyline');
    });

    it('limits non-sport multi-market events to the SSR list limit', () => {
        const event: BetsEventDataForUI = {
            id: 'event-2',
            title: 'Multi market event',
            endTime: 0,
            isSingleEvent: false,
            platform: PredictionPlatform.Polymarket,
            status: 'active',
            volume: '1000',
            markets: Array.from({ length: 25 }, (_, index) => createMarket(String(index), 'moneyline')),
        };

        expect(compactEventForPageTransfer(event).markets).toHaveLength(10);
    });
});
