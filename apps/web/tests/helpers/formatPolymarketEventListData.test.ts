import { BetsMarketResolveStatus } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { formatPolymarketMarketToBetsMarket } from '@/helpers/formatPolymarketEventListData.js';
import { PolymarketUmaResolutionStatus } from '@/providers/types/Firefly.js';
import type { PolymarketMarketData } from '@/providers/types/Firefly.js';

function baseMarket(overrides: Partial<PolymarketMarketData> = {}): PolymarketMarketData {
    return {
        id: 'mkt-1',
        question: 'Will X happen?',
        conditionId: 'cond-1',
        slug: 'will-x-happen',
        resolutionSource: '',
        endDate: '2026-12-31T00:00:00Z',
        liquidity: '1000',
        startDate: '2026-01-01T00:00:00Z',
        image: '',
        icon: '',
        description: '',
        outcomes: '["Yes","No"]',
        outcomePrices: '["0.6","0.4"]',
        volume: '5000',
        active: true,
        closed: false,
        marketMakerAddress: '',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        new: false,
        featured: false,
        submitted_by: '',
        archived: false,
        resolvedBy: '',
        restricted: false,
        groupItemTitle: '',
        groupItemThreshold: '',
        questionID: 'q-1',
        enableOrderBook: false,
        orderPriceMinTickSize: 0.01,
        orderMinSize: 1,
        volumeNum: 5000,
        liquidityNum: 1000,
        endDateIso: '2026-12-31T00:00:00Z',
        startDateIso: '2026-01-01T00:00:00Z',
        hasReviewedDates: false,
        volume24hr: 100,
        volume1wk: 700,
        volume1mo: 3000,
        volume1yr: 5000,
        clobTokenIds: '',
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
        clobRewards: [],
        rewardsMinSize: 0,
        rewardsMaxSpread: 0,
        spread: 0,
        oneDayPriceChange: 0,
        oneHourPriceChange: 0,
        oneWeekPriceChange: 0,
        lastTradePrice: 0.6,
        bestBid: 0,
        bestAsk: 0,
        automaticallyActive: false,
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
        umaResolutionStatus: undefined,
        ...overrides,
    } as PolymarketMarketData;
}

describe('formatPolymarketMarketToBetsMarket — isResolved', () => {
    it('is false when both status fields are absent/empty', () => {
        const result = formatPolymarketMarketToBetsMarket(
            baseMarket({ umaResolutionStatuses: '[]', umaResolutionStatus: undefined }),
        );
        expect(result.isResolved).toBe(false);
    });

    it('is true when umaResolutionStatus is Resolved', () => {
        const result = formatPolymarketMarketToBetsMarket(
            baseMarket({ umaResolutionStatus: PolymarketUmaResolutionStatus.Resolved }),
        );
        expect(result.isResolved).toBe(true);
    });

    it('is true when umaResolutionStatuses JSON array contains "resolved"', () => {
        const result = formatPolymarketMarketToBetsMarket(
            baseMarket({ umaResolutionStatuses: JSON.stringify([BetsMarketResolveStatus.Resolved]) }),
        );
        expect(result.isResolved).toBe(true);
    });

    it('is false when umaResolutionStatuses contains non-resolved statuses only', () => {
        const result = formatPolymarketMarketToBetsMarket(
            baseMarket({ umaResolutionStatuses: JSON.stringify([BetsMarketResolveStatus.Proposed]) }),
        );
        expect(result.isResolved).toBe(false);
    });

    it('is false for the old broken pattern — "Resolved" (uppercase) never matched', () => {
        // Regression guard: the old code did `=== 'Resolved'` on a JSON array string.
        // That could never be true. Confirm the new code doesn't regress to that.
        const result = formatPolymarketMarketToBetsMarket(
            baseMarket({ umaResolutionStatuses: 'Resolved' }), // malformed, not valid JSON array
        );
        expect(result.isResolved).toBe(false);
    });
});
