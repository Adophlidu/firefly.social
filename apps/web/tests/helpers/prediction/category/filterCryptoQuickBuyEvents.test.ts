import { describe, expect, it } from 'vitest';

import { filterAndSortCryptoQuickBuyEvents } from '@/helpers/prediction/category/filterCryptoQuickBuyEvents.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

function baseEvent(overrides: Partial<PolymarketEventListData>): PolymarketEventListData {
    return {
        id: 'e1',
        ticker: 'e1',
        slug: 'e1',
        title: 'e1',
        description: '',
        resolutionSource: '',
        startDate: '',
        creationDate: '',
        endDate: '',
        image: '',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        new: false,
        featured: false,
        restricted: false,
        liquidity: 0,
        volume: 0,
        openInterest: 0,
        createdAt: '',
        updatedAt: '',
        competitive: 0,
        volume24hr: 0,
        volume1wk: 0,
        volume1mo: 0,
        volume1yr: 0,
        enableOrderBook: false,
        liquidityClob: 0,
        negRisk: false,
        negRiskMarketID: '',
        commentCount: 0,
        markets: [],
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
        ...overrides,
    };
}

describe('filterAndSortCryptoQuickBuyEvents', () => {
    it('keeps only BTC/ETH/SOL and sorts BTC → ETH → SOL, preserving volume order within a coin', () => {
        const events = [
            baseEvent({ id: 'eth-1', slug: 'eth-a' }),
            baseEvent({ id: 'sol-1', slug: 'sol-a' }),
            baseEvent({ id: 'doge-1', slug: 'doge-a' }),
            baseEvent({ id: 'btc-1', slug: 'btc-a' }),
            baseEvent({ id: 'btc-2', slug: 'btc-b' }),
            baseEvent({ id: 'random-1', slug: 'election' }),
        ];

        const result = filterAndSortCryptoQuickBuyEvents(events);
        expect(result.map((event) => event.id)).toEqual(['btc-1', 'btc-2', 'eth-1', 'sol-1']);
    });

    it('returns an empty array when no event is BTC/ETH/SOL', () => {
        const events = [baseEvent({ id: 'doge', slug: 'doge-a' }), baseEvent({ id: 'xrp', slug: 'xrp-a' })];
        expect(filterAndSortCryptoQuickBuyEvents(events)).toEqual([]);
    });
});
