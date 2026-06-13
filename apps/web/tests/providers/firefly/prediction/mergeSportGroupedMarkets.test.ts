import { PredictionPlatform } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { mergeSportGroupedMarkets } from '@/providers/firefly/prediction/formatEvents.js';
import type {
    PolymarketSportDetail,
    PolymarketSportGroupedMarket,
    PolymarketSportGroupedMarketItem,
} from '@/providers/prediction/polymarket/type.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

const homeTeam: SportTeam = { name: 'Qatar', abbreviation: 'qat', color: '#96173D' };
const awayTeam: SportTeam = { name: 'Switzerland', abbreviation: 'che', color: '#DA291C' };

/** Build a binary (Yes/No) grouped-market item for one outcome of a 3-way market. */
function binaryItem(groupItemTitle: string, yesPrice: string, suffix: string): PolymarketSportGroupedMarketItem {
    return {
        id: `${suffix}-id`,
        slug: `${suffix}-slug`,
        conditionId: `${suffix}-condition`,
        groupItemTitle,
        outcomes: ['Yes', 'No'],
        outcomePrices: [yesPrice, String(1 - Number(yesPrice))],
        clobTokenIds: [`${suffix}-yes`, `${suffix}-no`],
        volumeClob: 1000,
    };
}

function buildSportDetail(
    types: Array<{ type: string; items: PolymarketSportGroupedMarketItem[] }>,
): PolymarketSportDetail {
    const groupedMarkets: PolymarketSportGroupedMarket[] = types.map(({ type, items }) => ({
        sportsMarketType: type,
        markets: items,
    }));
    return { slug: 'fifwc-qat-che-2026-06-13', groupedMarkets };
}

function buildEvent(markets: BetsMarketDataForUI[] = []): BetsEventDataForUI {
    return {
        id: 'event-1',
        title: 'Qatar vs. Switzerland',
        endTime: 0,
        isSingleEvent: false,
        platform: PredictionPlatform.Polymarket,
        status: 'active',
        volume: '0',
        markets,
        sportData: {
            gameId: 351719,
            live: false,
            ended: false,
            homeTeam,
            awayTeam,
            scores: [],
            scoreType: 0,
            isDraw: true,
        },
    };
}

function findMarket(markets: BetsMarketDataForUI[], type: string): BetsMarketDataForUI | undefined {
    return markets.find((m) => m.sportsMarketType === type);
}

describe('mergeSportGroupedMarkets — 3-way soccer merges', () => {
    it('merges soccer_first_to_score binary markets into one 3-outcome market (QAT / CHE / Neither)', () => {
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_first_to_score',
                items: [
                    binaryItem('Qatar', '0.16', 'qat'),
                    binaryItem('Switzerland', '0.805', 'che'),
                    binaryItem('Neither', '0.0465', 'neither'),
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);

        const firstToScoreMarkets = result.markets.filter((m) => m.sportsMarketType === 'soccer_first_to_score');
        expect(firstToScoreMarkets).toHaveLength(1);

        const merged = firstToScoreMarkets[0];
        expect(merged.outcomes).toHaveLength(3);
        // Outcomes are ordered home / away / middle; home & away render via abbreviation.
        expect(merged.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', 'Neither']);
        expect(merged.outcomes.map((o) => o.price)).toEqual(['0.16', '0.805', '0.0465']);
        // The middle outcome keeps its own slug/id (neither market), not the home market's.
        expect(merged.outcomes[2]?.slug).toBe('neither-slug');
    });

    it('merges soccer_first_to_score even when groupItemTitle is localized (zh)', () => {
        // The sport-detail API translates groupItemTitle (卡塔尔 / 瑞士 / 两者都不), which no
        // longer matches the English team names. The slug suffix (-home/-away/-neither) is the
        // locale-independent signal that must drive the classification.
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_first_to_score',
                items: [
                    {
                        ...binaryItem('卡塔尔', '0.16', 'qat'),
                        slug: 'fifwc-qat-che-2026-06-13-first-to-score-home',
                    },
                    {
                        ...binaryItem('瑞士', '0.805', 'che'),
                        slug: 'fifwc-qat-che-2026-06-13-first-to-score-away',
                    },
                    {
                        ...binaryItem('两者都不', '0.0465', 'neither'),
                        slug: 'fifwc-qat-che-2026-06-13-first-to-score-neither',
                    },
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);

        const merged = findMarket(result.markets, 'soccer_first_to_score');
        expect(merged).toBeDefined();
        expect(merged?.outcomes).toHaveLength(3);
        expect(merged?.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', '两者都不']);
        expect(merged?.outcomes.map((o) => o.price)).toEqual(['0.16', '0.805', '0.0465']);
    });

    it('reclassifies lumped soccer_player_goals items by slug, unambiguously (zh titles)', () => {
        // The slug is the locale-independent signal. Multi-word props must be detected before
        // their substrings: "-shots-on-target-" contains "-shots-", "-goals-plus-assists-"
        // contains "-assists-". Ignored props route to their own type to be filtered downstream.
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_player_goals',
                items: [
                    { ...binaryItem('进球 ≥ 1', '0.5', 'goals-p1'), slug: 'match-goals-player1-gte1' },
                    { ...binaryItem('助攻 ≥ 1', '0.5', 'assists-p2'), slug: 'match-assists-player2-gte1' },
                    { ...binaryItem('射门 ≥ 2', '0.5', 'shots-p3'), slug: 'match-shots-player3-gte2' },
                    { ...binaryItem('射正 ≥ 1', '0.5', 'sot-p4'), slug: 'match-shots-on-target-player4-gte1' },
                    { ...binaryItem('进球+助攻 ≥ 1', '0.5', 'gpa-p5'), slug: 'match-goals-plus-assists-player5-gte1' },
                    { ...binaryItem('扑救 ≥ 2', '0.5', 'saves-p6'), slug: 'match-saves-player6-gte2' },
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);
        const types = new Set(result.markets.map((m) => m.sportsMarketType));

        // Rendered prop types.
        expect(types).toContain('soccer_player_goals');
        expect(types).toContain('soccer_player_assists');
        expect(types).toContain('soccer_player_shots');
        // shots-on-target must NOT collapse into soccer_player_shots.
        expect(types).toContain('soccer_player_shots_on_target');
        // goals-plus-assists / goalkeeper-saves route to their own (ignored) types, not assists/goals.
        expect(types).toContain('soccer_player_goals_plus_assists');
        expect(types).toContain('soccer_player_goalkeeper_saves');
    });

    it('merges soccer_halftime_result when groupItemTitle is localized (zh)', () => {
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_halftime_result',
                items: [
                    {
                        ...binaryItem('卡塔尔', '0.08', 'ht-qat'),
                        slug: 'fifwc-qat-che-2026-06-13-halftime-result-home',
                    },
                    {
                        ...binaryItem('平局', '0.315', 'ht-draw'),
                        slug: 'fifwc-qat-che-2026-06-13-halftime-result-draw',
                    },
                    {
                        ...binaryItem('瑞士', '0.61', 'ht-che'),
                        slug: 'fifwc-qat-che-2026-06-13-halftime-result-away',
                    },
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);

        const merged = findMarket(result.markets, 'soccer_halftime_result');
        expect(merged).toBeDefined();
        expect(merged?.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', '平局']);
    });

    it('still yields a "Draw" middle label for soccer_halftime_result (no regression)', () => {
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_halftime_result',
                items: [
                    binaryItem('Qatar', '0.08', 'ht-qat'),
                    binaryItem('Draw', '0.315', 'ht-draw'),
                    binaryItem('Switzerland', '0.61', 'ht-che'),
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);

        const merged = findMarket(result.markets, 'soccer_halftime_result');
        expect(merged).toBeDefined();
        expect(merged?.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', 'Draw']);
    });

    it('merges both first-to-score and halftime in the same event', () => {
        const sportDetail = buildSportDetail([
            {
                type: 'soccer_first_to_score',
                items: [
                    binaryItem('Qatar', '0.16', 'fts-qat'),
                    binaryItem('Switzerland', '0.805', 'fts-che'),
                    binaryItem('Neither', '0.0465', 'fts-neither'),
                ],
            },
            {
                type: 'soccer_halftime_result',
                items: [
                    binaryItem('Qatar', '0.08', 'ht-qat'),
                    binaryItem('Draw', '0.315', 'ht-draw'),
                    binaryItem('Switzerland', '0.61', 'ht-che'),
                ],
            },
        ]);

        const result = mergeSportGroupedMarkets(buildEvent(), sportDetail);

        const firstToScore = findMarket(result.markets, 'soccer_first_to_score');
        const halftime = findMarket(result.markets, 'soccer_halftime_result');

        expect(firstToScore?.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', 'Neither']);
        expect(halftime?.outcomes.map((o) => o.label)).toEqual(['QAT', 'CHE', 'Draw']);
        // Each type collapsed from 3 binary markets into 1 merged market.
        expect(result.markets.filter((m) => m.sportsMarketType === 'soccer_first_to_score')).toHaveLength(1);
        expect(result.markets.filter((m) => m.sportsMarketType === 'soccer_halftime_result')).toHaveLength(1);
    });
});
