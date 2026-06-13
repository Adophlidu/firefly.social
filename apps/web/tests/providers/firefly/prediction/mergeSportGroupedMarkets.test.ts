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
function binaryItem(
    groupItemTitle: string,
    yesPrice: string,
    suffix: string,
): PolymarketSportGroupedMarketItem {
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

function buildSportDetail(types: Array<{ type: string; items: PolymarketSportGroupedMarketItem[] }>): PolymarketSportDetail {
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
