import { PredictionPlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { resolveGameMarketOgData } from '@/helpers/prediction/resolveGameMarketOgData.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, BetsMarketOutcome, SportEventData } from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

function outcome(label: string, price: string): BetsMarketOutcome {
    return { id: `o-${label}`, label, price };
}

function moneylineMarket(outcomes: BetsMarketOutcome[]): BetsMarketDataForUI {
    return {
        id: 'mkt-1',
        conditionId: 'cond-1',
        questionId: 'q-1',
        title: 'Moneyline',
        volume: '1000',
        isResolved: false,
        isClosed: false,
        createTime: 0,
        sportsMarketType: 'moneyline',
        outcomes,
    };
}

function gameEvent(market: BetsMarketDataForUI, sportData: Partial<SportEventData>): BetsEventDataForUI {
    return {
        id: 'evt-1',
        title: 'Home vs Away',
        endTime: 0,
        isSingleEvent: true,
        platform: PredictionPlatform.Polymarket,
        status: 'active',
        volume: '12345',
        markets: [market],
        sportData: {
            gameId: 1,
            live: false,
            ended: false,
            homeTeam: { name: 'Home' },
            awayTeam: { name: 'Away' },
            scores: [],
            scoreType: 0,
            isDraw: false,
            ...sportData,
        } as SportEventData,
    };
}

describe('resolveGameMarketOgData', () => {
    it('includes the draw outcome in the displayed percentages for 3-way markets (matches the detail page)', () => {
        // bol1-aur-abb style: home 0.34, away 0.33, draw 0.33.
        const event = gameEvent(
            moneylineMarket([outcome('Home', '0.34'), outcome('Away', '0.33'), outcome('Draw', '0.33')]),
            { isDraw: true },
        );

        const data = resolveGameMarketOgData(event);

        expect(data).not.toBeNull();
        // Percentages are normalized across home/away/draw, like SportTeamDataDisplay.
        expect(data!.homePercent).toBe(34);
        expect(data!.awayPercent).toBe(33);
        // The bar fill stays two-team (home + away = 1), so the segments still span the full bar.
        expect(data!.homeRatio).toBeCloseTo(0.34 / 0.67, 5);
        expect(data!.awayRatio).toBeCloseTo(0.33 / 0.67, 5);
        expect(data!.homeRatio + data!.awayRatio).toBeCloseTo(1, 5);
    });

    it('leaves two-way markets unchanged', () => {
        const event = gameEvent(moneylineMarket([outcome('Home', '0.6'), outcome('Away', '0.4')]), { isDraw: false });

        const data = resolveGameMarketOgData(event);

        expect(data).not.toBeNull();
        expect(data!.homePercent).toBe(60);
        expect(data!.awayPercent).toBe(40);
        expect(data!.homeRatio).toBeCloseTo(0.6, 5);
        expect(data!.awayRatio).toBeCloseTo(0.4, 5);
    });

    it('reports the upcoming state for games that have not started', () => {
        const event = gameEvent(moneylineMarket([outcome('Home', '0.6'), outcome('Away', '0.4')]), {});

        expect(resolveGameMarketOgData(event)!.state).toBe('upcoming');
    });

    it('exposes the score and ended state so the OG can render the score instead of percentages', () => {
        // lol-gen-kt style: resolved market (prices 1/0 → 100%/0%) but the detail page shows the score 1 - 0.
        const event = gameEvent(moneylineMarket([outcome('Home', '1'), outcome('Away', '0')]), {
            ended: true,
            scores: [{ score: [1, 0] }],
        });

        const data = resolveGameMarketOgData(event);

        expect(data).not.toBeNull();
        expect(data!.state).toBe('ended');
        expect(data!.homeScore).toBe(1);
        expect(data!.awayScore).toBe(0);
        // Home won, so the away side is muted.
        expect(data!.loser).toBe('away');
        expect(data!.multipleSets).toBe(false);
    });

    it('marks in-progress games as live and does not compute a loser yet', () => {
        const event = gameEvent(moneylineMarket([outcome('Home', '0.7'), outcome('Away', '0.3')]), {
            live: true,
            scores: [{ score: [2, 1] }],
        });

        const data = resolveGameMarketOgData(event);

        expect(data!.state).toBe('live');
        expect(data!.homeScore).toBe(2);
        expect(data!.awayScore).toBe(1);
        expect(data!.loser).toBeUndefined();
    });

    it('flags multi-set (tennis) scoring', () => {
        const event = gameEvent(moneylineMarket([outcome('Home', '0.5'), outcome('Away', '0.5')]), {
            ended: true,
            scoreType: SportScoreType.Multiple,
            scores: [{ score: [6, 4] }, { score: [7, 5] }],
            winResult: 0,
        });

        const data = resolveGameMarketOgData(event);

        expect(data!.multipleSets).toBe(true);
        expect(data!.scores).toHaveLength(2);
        expect(data!.loser).toBe('away');
    });
});
