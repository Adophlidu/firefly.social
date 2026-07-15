import { describe, expect, it } from 'vitest';

import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent, PolymarketMarket } from '@/providers/prediction/polymarket/type.js';

/**
 * Regression for the Buy Yes/No button prices on the event page's market list.
 *
 * The buttons must show each token's live order-book ask (Buy Yes = bestAsk,
 * Buy No = 1 - bestBid). Gamma only exposes bestBid/bestAsk for the first (Yes)
 * token, so the No-token ask is derived. Before the fix, per-outcome bestAsk was
 * never populated, so illiquid markets fell back to outcomePrices (the mid) and
 * rendered complementary values like 50.5¢/49.5¢ instead of matching the official
 * site's independent asks (e.g. 99¢/99¢).
 */

/** Minimal Gamma market with required fields pre-filled. */
function gammaMarket(overrides: Partial<PolymarketMarket>): PolymarketMarket {
    return {
        id: 'm-id',
        question: '',
        conditionId: 'cond',
        slug: '',
        endDate: '',
        createdAt: '',
        liquidity: '0',
        image: '',
        icon: '',
        description: '',
        outcomes: '["Yes","No"]',
        outcomePrices: '["0.505","0.495"]',
        volume: '0',
        active: true,
        closed: false,
        new: false,
        negRisk: false,
        umaResolutionStatus: '',
        umaResolutionStatuses: '[]',
        groupItemTitle: '',
        groupItemThreshold: '0',
        clobTokenIds: '["yes-id","no-id"]',
        oneDayPriceChange: '0',
        oneWeekPriceChange: '0',
        events: [],
        orderPriceMinTickSize: '0',
        ...overrides,
    };
}

function gammaEvent(markets: PolymarketMarket[]): PolymarketEvent {
    return {
        id: 'e-id',
        slug: 'ewc-2026-region',
        title: 'EWC 2026',
        description: '',
        startDate: '',
        creationDate: '',
        endDate: '',
        image: '',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        new: false,
        liquidity: '0',
        volume: '0',
        openInterest: '0',
        createdAt: '',
        updatedAt: '',
        negRisk: false,
        sortBy: '',
        markets,
        series: [],
        tags: [],
    };
}

describe('formatPolymarketEvent — Buy button ask derivation', () => {
    it('derives Yes ask from bestAsk and No ask from (1 - bestBid), not the mid price', () => {
        // LCK-like: liquid market. bestBid=0.02, bestAsk=0.99 → 99¢ / 98¢.
        const [market] = formatPolymarketEvent(gammaEvent([gammaMarket({ bestAsk: 0.99, bestBid: 0.02 })])).markets;

        expect(market.outcomes[0].bestAsk).toBe('0.99');
        expect(market.outcomes[1].bestAsk).toBe('0.98');
    });

    it('does NOT fall back to complementary mid prices for illiquid markets', () => {
        // LCS-like: no trades. outcomePrices mid is 0.505/0.495, but the real asks are
        // independent (bestAsk=1, bestBid=0.01). Yes has no ask (1 → the UI shows "--"),
        // Buy No = 1 - 0.01 = 0.99 → 99¢. The bug rendered the mid (0.505/0.495) instead.
        const [market] = formatPolymarketEvent(gammaEvent([gammaMarket({ bestAsk: 1, bestBid: 0.01 })])).markets;

        expect(market.outcomes[0].bestAsk).toBe('1');
        expect(market.outcomes[1].bestAsk).toBe('0.99');
        // Guard: the ask must not be the mid price the bug used.
        expect(market.outcomes[0].bestAsk).not.toBe(market.outcomes[0].price);
    });

    it('derives each side independently when Gamma omits only one of bestBid/bestAsk', () => {
        // bestAsk present but bestBid omitted: Buy Yes must still show its real ask
        // instead of both sides regressing to the mid price.
        const [market] = formatPolymarketEvent(gammaEvent([gammaMarket({ bestAsk: 0.99 })])).markets;

        expect(market.outcomes[0].bestAsk).toBe('0.99');
        expect(market.outcomes[1].bestAsk).toBeUndefined();
    });

    it('leaves bestAsk undefined when Gamma omits bestBid/bestAsk (falls back to mid)', () => {
        const [market] = formatPolymarketEvent(gammaEvent([gammaMarket({})])).markets;

        expect(market.outcomes[0].bestAsk).toBeUndefined();
        expect(market.outcomes[1].bestAsk).toBeUndefined();
    });

    it('does not derive asks for non-binary markets', () => {
        const [market] = formatPolymarketEvent(
            gammaEvent([
                gammaMarket({
                    outcomes: '["A","B","C"]',
                    outcomePrices: '["0.4","0.3","0.3"]',
                    clobTokenIds: '["a","b","c"]',
                    bestAsk: 0.9,
                    bestBid: 0.1,
                }),
            ]),
        ).markets;

        expect(market.outcomes.every((o) => o.bestAsk === undefined)).toBe(true);
    });
});
