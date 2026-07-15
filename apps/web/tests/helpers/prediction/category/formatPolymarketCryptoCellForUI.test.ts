import { describe, expect, it } from 'vitest';

import { formatPolymarketCryptoCellForUI } from '@/helpers/prediction/category/formatPolymarketCryptoCellForUI.js';
import {
    type PolymarketEventListData,
    type PolymarketMarketData,
    PolymarketUmaResolutionStatus,
} from '@/providers/types/Firefly.js';

function baseMarket(overrides: Partial<PolymarketMarketData>): PolymarketMarketData {
    return {
        id: 'm1',
        question: 'q',
        conditionId: '',
        slug: 'm1',
        resolutionSource: '',
        endDate: '',
        liquidity: '',
        startDate: '',
        image: '',
        icon: '',
        description: '',
        outcomes: '["Yes","No"]',
        outcomePrices: '["0.5","0.5"]',
        volume: '',
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
        enableOrderBook: false,
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
        acceptingOrders: false,
        negRisk: false,
        negRiskMarketID: '',
        negRiskRequestID: '',
        ready: false,
        funded: false,
        acceptingOrdersTimestamp: '',
        cyom: false,
        competitive: 0,
        pagerDutyNotificationEnabled: false,
        approved: false,
        clobRewards: [],
        rewardsMinSize: 0,
        rewardsMaxSpread: 0,
        spread: 0,
        oneDayPriceChange: 0,
        oneHourPriceChange: 0,
        oneWeekPriceChange: 0,
        lastTradePrice: 0,
        bestBid: 0,
        bestAsk: 0,
        automaticallyActive: false,
        clearBookOnStart: false,
        seriesColor: '',
        showGmpSeries: false,
        showGmpOutcome: false,
        manualActivation: false,
        negRiskOther: false,
        umaResolutionStatuses: '',
        pendingDeployment: false,
        deploying: false,
        deployingTimestamp: '',
        rfqEnabled: false,
        holdingRewardsEnabled: false,
        feesEnabled: false,
        requiresTranslation: false,
        ...overrides,
    };
}

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

/** A single-market periodic Up/Down event for the given coin + slug. */
function singleEvent(slug: string, coinPrefix: string, prices: [string, string] = ['0.6', '0.4']) {
    return baseEvent({
        slug,
        title: `${coinPrefix} Up or Down`,
        markets: [
            baseMarket({
                id: 'm1',
                slug: `${slug}-market`,
                question: `${coinPrefix} Up or Down`,
                outcomes: '["Up","Down"]',
                outcomePrices: JSON.stringify(prices),
            }),
        ],
    });
}

describe('formatPolymarketCryptoCellForUI — null fallback', () => {
    it('returns null for a non-periodic crypto event (coin resolves but not Up/Down)', () => {
        const event = baseEvent({
            slug: 'bitcoin-will-reach-100k',
            markets: [baseMarket({ outcomes: '["Yes","No"]', outcomePrices: '["0.5","0.5"]' })],
        });
        expect(formatPolymarketCryptoCellForUI(event)).toBeNull();
    });

    it('returns null for a periodic Up/Down event whose coin does not resolve', () => {
        const event = baseEvent({
            slug: 'someasset-up-or-down-5m-1',
            markets: [baseMarket({ outcomes: '["Up","Down"]', outcomePrices: '["0.5","0.5"]' })],
        });
        expect(formatPolymarketCryptoCellForUI(event)).toBeNull();
    });

    it('returns null for a single periodic market with fewer than 2 outcomes', () => {
        const event = baseEvent({
            slug: 'bitcoin-up-or-down-5m-1',
            markets: [baseMarket({ outcomes: '["Up"]', outcomePrices: '["1"]' })],
        });
        expect(formatPolymarketCryptoCellForUI(event)).toBeNull();
    });
});

describe('formatPolymarketCryptoCellForUI — periodic detection (single variant)', () => {
    it('classifies a 5m Up/Down market as periodic single', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-5m-1716123456', 'Bitcoin'));
        expect(model).not.toBeNull();
        expect(model!.body.variant).toBe('single');
        expect(model!.coinLabel).toBe('Bitcoin');
        expect(model!.isLive).toBe(true);
    });

    it('classifies an hourly Up/Down market as periodic', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-jul-15-2024-1pm-et', 'Bitcoin'));
        expect(model).not.toBeNull();
        expect(model!.body.variant).toBe('single');
    });

    it('classifies a daily Up/Down market as periodic', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-on-jul-15-2024', 'Bitcoin'));
        expect(model).not.toBeNull();
        expect(model!.body.variant).toBe('single');
    });

    it('classifies an isUpDownFamily "other" slug as periodic', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-special', 'Bitcoin'));
        expect(model).not.toBeNull();
        expect(model!.body.variant).toBe('single');
    });
});

describe('formatPolymarketCryptoCellForUI — coin resolution', () => {
    const cases: Array<[string, string]> = [
        ['Bitcoin', 'bitcoin-up-or-down-5m-1'],
        ['Ethereum', 'ethereum-up-or-down-5m-1'],
        ['Solana', 'solana-up-or-down-5m-1'],
        ['XRP', 'xrp-up-or-down-5m-1'],
        ['Dogecoin', 'dogecoin-up-or-down-5m-1'],
        ['Hype', 'hype-up-or-down-5m-1'],
        ['BNB', 'bnb-up-or-down-5m-1'],
    ];

    for (const [label, slug] of cases) {
        it(`resolves ${label} from slug prefix`, () => {
            const model = formatPolymarketCryptoCellForUI(singleEvent(slug, label));
            expect(model).not.toBeNull();
            expect(model!.coinLabel).toBe(label);
            expect(model!.eventSlug).toBe(slug);
        });
    }
});

describe('formatPolymarketCryptoCellForUI — single body', () => {
    it('reads outcome labels + cents from market.outcomes and computes bar percents', () => {
        const model = formatPolymarketCryptoCellForUI(
            singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['0.6', '0.4']),
        );
        expect(model).not.toBeNull();
        expect(model!.body).toEqual({
            variant: 'single',
            marketSlug: 'bitcoin-up-or-down-5m-1-market',
            outcomes: [
                { label: 'Up', priceCents: '60.0¢', percent: 60 },
                { label: 'Down', priceCents: '40.0¢', percent: 40 },
            ],
        });
    });

    it('clamps an out-of-range price to the 50¢ fallback and a 0–100 percent', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['2', '0']));
        expect(model).not.toBeNull();
        expect(model!.body).toMatchObject({
            variant: 'single',
            outcomes: [
                { label: 'Up', priceCents: '50¢', percent: 100 },
                { label: 'Down', priceCents: '0.0¢', percent: 0 },
            ],
        });
    });

    it('clamps an out-of-range price to the 50¢ fallback and a 0–100 percent', () => {
        const model = formatPolymarketCryptoCellForUI(singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['2', '0']));
        expect(model).not.toBeNull();
        expect(model!.body).toMatchObject({
            variant: 'single',
            outcomes: [
                { label: 'Up', priceCents: '50¢', percent: 100 },
                { label: 'Down', priceCents: '0.0¢', percent: 0 },
            ],
        });
    });
});

describe('formatPolymarketCryptoCellForUI — isLive derivation', () => {
    it('shows Live for an active, not-decided recurring market', () => {
        const model = formatPolymarketCryptoCellForUI(
            singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['0.6', '0.4']),
        );
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(true);
    });

    it('hides Live when the market is decided (an outcome pinned at 100%)', () => {
        const event = singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['1', '0']);
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(false);
    });

    it('hides Live when the market is closed', () => {
        const event = singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin');
        event.markets[0].closed = true;
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(false);
    });

    it('hides Live when the market is UMA-resolved even if not closed or decided', () => {
        // A resolved market is no longer tradable even in the transient window before its outcome
        // price pins at 100% — Live must not sit over a market the row selector would exclude.
        const event = singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['0.6', '0.4']);
        event.markets[0].umaResolutionStatus = PolymarketUmaResolutionStatus.Resolved;
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(false);
    });

    it('still shows Live when the event-level closed flag lags a still-tradable market', () => {
        // event.closed flips between recurring cycles even while the underlying market stays
        // tradable — Live must follow the market state, not the event flag.
        const event = singleEvent('bitcoin-up-or-down-5m-1', 'Bitcoin', ['0.6', '0.4']);
        event.closed = true;
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(true);
    });

    it('shows Live for a multi-market event as long as any market is tradable', () => {
        const event = baseEvent({
            slug: 'bitcoin-multistrike-4h-jul-15',
            markets: [
                baseMarket({ id: 'a', slug: 'a', outcomes: '["Yes","No"]', outcomePrices: '["1","0"]' }), // decided
                baseMarket({ id: 'b', slug: 'b', outcomes: '["Yes","No"]', outcomePrices: '["0.6","0.4"]' }), // tradable
            ],
        });
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.isLive).toBe(true);
    });
});

describe('formatPolymarketCryptoCellForUI — threshold-multi classification', () => {
    it('routes a crypto "hit-price" multi-market threshold event through the multi cell', () => {
        // Not an Up/Down slug, but a crypto multi-market threshold event — must use the periodic
        // multi-cell (coin label, no countdown) instead of falling through to BetItem.
        const event = baseEvent({
            slug: 'what-price-will-bitcoin-hit-on-july-14',
            title: 'What price will Bitcoin hit on July 14?',
            markets: [
                baseMarket({
                    id: 'a',
                    slug: 'a',
                    groupItemTitle: '↑ 65,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.6","0.4"]',
                }),
                baseMarket({
                    id: 'b',
                    slug: 'b',
                    groupItemTitle: '↑ 70,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.3","0.7"]',
                }),
                baseMarket({
                    id: 'c',
                    slug: 'c',
                    groupItemTitle: '↑ 75,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["1","0"]', // decided — excluded
                }),
            ],
        });
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.coinLabel).toBe('Bitcoin');
        expect(model!.body.variant).toBe('multi');
        if (model!.body.variant !== 'multi') return;
        // Top-2 by win-rate, decided market excluded.
        expect(model!.body.rows.map((row) => row.thresholdLabel)).toEqual(['↑ 65,000', '↑ 70,000']);
        expect(model!.body.rows.map((row) => row.winRateLabel)).toEqual(['60%', '30%']);
    });

    it('excludes markets that render as 100% (price 0.99–1.0) from the top-2', () => {
        // Real "bitcoin-above-on-july-15-2026" shape: four low thresholds sit at 0.996–0.9995, which
        // render as "100%" via Math.ceil but are < 1.0 so the >=1 decided check misses them. The cell
        // must skip them and show the next two highest (99%, 95%) instead of two 100% rows.
        const threshold = (id: string, yes: string) =>
            baseMarket({
                id,
                slug: id,
                groupItemTitle: id,
                outcomes: '["Yes","No"]',
                outcomePrices: JSON.stringify([yes, String(1 - Number.parseFloat(yes))]),
            });
        const event = baseEvent({
            slug: 'bitcoin-above-on-july-15-2026',
            title: 'Bitcoin above ___ on July 15?',
            markets: [
                threshold('52,000', '0.9995'), // renders 100%
                threshold('54,000', '0.9995'), // renders 100%
                threshold('56,000', '0.9995'), // renders 100%
                threshold('58,000', '0.996'), // renders 100%
                threshold('60,000', '0.9865'), // 99%
                threshold('62,000', '0.945'), // 95%
                threshold('64,000', '0.5'), // 50%
                threshold('66,000', '0.0575'),
                threshold('68,000', '0.0065'),
                threshold('70,000', '0.0025'),
                threshold('72,000', '0.0005'),
            ],
        });
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        if (model!.body.variant !== 'multi') return;
        // 52k/54k/56k/58k (all "100%") excluded; top-2 = 60,000 (99%) and 62,000 (95%).
        expect(model!.body.rows.map((row) => row.thresholdLabel)).toEqual(['60,000', '62,000']);
        expect(model!.body.rows.map((row) => row.winRateLabel)).toEqual(['99%', '95%']);
        expect(model!.body.rows.map((row) => row.winRateLabel)).not.toContain('100%');
    });

    it('keeps a non-crypto (stock) multi-market threshold event on BetItem', () => {
        // SPY has threshold markets like a crypto hit-price event, but no coin resolves — must NOT
        // be swept into the periodic crypto cell by the threshold-multi broadening.
        const event = baseEvent({
            slug: 'spy-closes-above-on-july-15-2026',
            markets: [
                baseMarket({
                    id: 'a',
                    slug: 'a',
                    groupItemTitle: '↑ 550',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.6","0.4"]',
                }),
                baseMarket({
                    id: 'b',
                    slug: 'b',
                    groupItemTitle: '↑ 560',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.3","0.7"]',
                }),
            ],
        });
        expect(formatPolymarketCryptoCellForUI(event)).toBeNull();
    });
});

describe('formatPolymarketCryptoCellForUI — multi body', () => {
    it('renders the multi variant with top-2 threshold rows, excluding the ≥100% decided market', () => {
        const event = baseEvent({
            slug: 'bitcoin-multistrike-4h-jul-15',
            title: 'Bitcoin Above',
            markets: [
                baseMarket({
                    id: 'a',
                    slug: 'a',
                    question: 'Bitcoin Above 62000',
                    groupItemTitle: '62,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.6","0.4"]',
                }),
                baseMarket({
                    id: 'b',
                    slug: 'b',
                    question: 'Bitcoin Above 63000',
                    groupItemTitle: '63,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.3","0.7"]',
                }),
                baseMarket({
                    id: 'c',
                    slug: 'c',
                    question: 'Bitcoin Above 64000',
                    groupItemTitle: '64,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["1","0"]', // decided ≥100% — must be excluded
                }),
            ],
        });

        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        expect(model!.body.variant).toBe('multi');
        if (model!.body.variant !== 'multi') return;

        const labels = model!.body.rows.map((row) => row.thresholdLabel);
        expect(labels).toEqual(['62,000', '63,000']);
        expect(labels).not.toContain('64,000');

        // Sorted by win-rate desc (0.6 → 60% before 0.3 → 30%).
        expect(model!.body.rows[0]).toEqual({
            marketSlug: 'a',
            thresholdLabel: '62,000',
            winRateLabel: '60%',
            winRatePercent: 60,
            outcomes: ['Yes', 'No'],
        });
        expect(model!.body.rows[1].winRateLabel).toBe('30%');
    });

    it('falls back to the groupItemTitle || question || title order for the threshold label', () => {
        const event = baseEvent({
            slug: 'bitcoin-multistrike-4h-jul-15',
            markets: [
                baseMarket({
                    id: 'a',
                    slug: 'a',
                    question: 'Bitcoin Above 62000',
                    // no groupItemTitle → falls back to question
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.6","0.4"]',
                }),
                baseMarket({
                    id: 'b',
                    slug: 'b',
                    question: 'Bitcoin Above 63000',
                    groupItemTitle: '63,000',
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.3","0.7"]',
                }),
            ],
        });
        const model = formatPolymarketCryptoCellForUI(event);
        expect(model).not.toBeNull();
        if (model!.body.variant !== 'multi') return;
        // Row 'a' has the higher win-rate (0.6) so it sorts first and shows its question fallback.
        expect(model!.body.rows[0].thresholdLabel).toBe('Bitcoin Above 62000');
        expect(model!.body.rows[1].thresholdLabel).toBe('63,000');
    });
});
