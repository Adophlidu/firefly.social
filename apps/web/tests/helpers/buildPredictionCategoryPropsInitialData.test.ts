import { createIndicator, createPageable } from '@dimensiondev/utils';
import { describe, expect, it } from 'vitest';

import { SSR_LIST_LIMIT, SSR_POLYMARKET_LIST_MARKETS_LIMIT } from '@/constants/ssr.js';
import { buildPredictionCategoryPropsInitialData } from '@/helpers/buildPredictionCategoryPropsInitialData.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

function event(id: string, marketCount = 1): PolymarketEventListData {
    return {
        id,
        ticker: id,
        slug: id,
        title: id,
        description: 'long description',
        resolutionSource: 'source',
        startDate: '2026-01-01',
        creationDate: '2026-01-01',
        endDate: '2026-12-31',
        image: 'img',
        icon: 'icon',
        active: true,
        closed: false,
        archived: false,
        new: false,
        featured: false,
        restricted: false,
        liquidity: 0,
        volume: 100,
        openInterest: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        competitive: 0,
        volume24hr: 0,
        volume1wk: 0,
        volume1mo: 0,
        volume1yr: 0,
        enableOrderBook: true,
        liquidityClob: 0,
        negRisk: false,
        negRiskMarketID: '',
        commentCount: 0,
        markets: Array.from({ length: marketCount }, (_, index) => ({
            id: `${id}-m${index}`,
            question: 'question',
            conditionId: 'c',
            slug: 's',
            resolutionSource: '',
            endDate: '',
            liquidity: '0',
            startDate: '',
            image: '',
            icon: '',
            description: 'market description',
            outcomes: '[]',
            outcomePrices: '[]',
            volume: '0',
            active: true,
            closed: false,
            marketMakerAddress: '',
            createdAt: '',
            updatedAt: '',
            new: false,
            featured: false,
            submitted_by: '',
            archived: false,
            resolvedBy: '',
            restricted: false,
            groupItemTitle: '',
            groupItemThreshold: '',
            questionID: '',
            enableOrderBook: true,
            orderPriceMinTickSize: 0,
            orderMinSize: 0,
            volumeNum: 0,
            liquidityNum: 0,
            endDateIso: '',
            startDateIso: '',
            hasReviewedDates: false,
            volume24hr: 0,
            volume1wk: 0,
            volume1mo: 0,
            volume1yr: 0,
            clobTokenIds: '[]',
            umaBond: '',
            umaReward: '',
            volume24hrClob: 0,
            volume1wkClob: 0,
            volume1moClob: 0,
            volume1yrClob: 0,
            volumeClob: 0,
            liquidityClob: 0,
            customLiveness: 0,
            acceptingOrders: true,
            negRisk: false,
            negRiskMarketID: '',
            negRiskRequestID: '',
            ready: true,
            funded: true,
            acceptingOrdersTimestamp: '',
            cyom: false,
            competitive: 0,
            pagerDutyNotificationEnabled: false,
            approved: true,
            clobRewards: [{ id: 'r1' } as never],
            rewardsMinSize: 0,
            rewardsMaxSpread: 0,
            spread: 0,
            oneDayPriceChange: 0,
            oneHourPriceChange: 0,
            oneWeekPriceChange: 0,
            lastTradePrice: 0,
            bestBid: 0,
            bestAsk: 0,
            automaticallyActive: true,
            clearBookOnStart: false,
            seriesColor: '',
            showGmpSeries: false,
            showGmpOutcome: false,
            manualActivation: false,
            negRiskOther: false,
            umaResolutionStatuses: '[]',
            pendingDeployment: false,
            deploying: false,
            deployingTimestamp: '',
            rfqEnabled: false,
            holdingRewardsEnabled: false,
            feesEnabled: false,
            requiresTranslation: false,
        })),
        tags: [],
        cyom: false,
        showAllOutcomes: false,
        showMarketImages: false,
        enableNegRisk: false,
        automaticallyActive: false,
        gmpChartMode: '',
        negRiskAugmented: false,
        featuredOrder: 0,
        pendingDeployment: false,
        deploying: false,
        deployingTimestamp: '',
        requiresTranslation: false,
        is_ff_activity: false,
    };
}

describe('buildPredictionCategoryPropsInitialData', () => {
    it('returns undefined for empty pages', () => {
        expect(buildPredictionCategoryPropsInitialData(createPageable([], createIndicator()))).toBeUndefined();
    });

    it('slices and compacts the first page for SSR transfer', () => {
        const page = createPageable(
            Array.from({ length: SSR_LIST_LIMIT + 5 }, (_, index) => event(String(index), 15)),
            createIndicator(undefined, ''),
        );
        const initial = buildPredictionCategoryPropsInitialData(page);

        expect(initial?.pages[0]?.data).toHaveLength(SSR_LIST_LIMIT);
        expect(initial?.pages[0]?.data[0]?.description).toBe('');
        expect(initial?.pages[0]?.data[0]?.markets).toHaveLength(SSR_POLYMARKET_LIST_MARKETS_LIMIT);
        expect(initial?.pageParams).toEqual(['']);
    });
});

describe('compactPolymarketEventListDataForPageTransfer', () => {
    it('strips heavy event and market fields', async () => {
        const { compactPolymarketEventListDataForPageTransfer } =
            await import('@/helpers/compactPolymarketEventListDataForPageTransfer.js');
        const compacted = compactPolymarketEventListDataForPageTransfer(event('e1', 20));

        expect(compacted.description).toBe('');
        expect(compacted.series).toBeNull();
        expect(compacted.markets).toHaveLength(SSR_POLYMARKET_LIST_MARKETS_LIMIT);
        expect(compacted.markets[0]?.description).toBe('');
        expect(compacted.markets[0]?.clobRewards).toEqual([]);
    });
});
