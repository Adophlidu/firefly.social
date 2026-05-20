import { describe, expect, it } from 'vitest';

import {
    formatPolymarketSportsEventForUI,
    formatPriceCents,
} from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import {
    applySportsMarketPriceOverrides,
    collectLiveSportsMarketAssetIds,
    collectSportsEventMarketAssetIds,
    resolveWsOutcomeDisplayPrice,
} from '@/helpers/prediction/category/sportsMarketLivePrices.js';
import type { PolymarketSportsEvent, PolymarketSportsMarketData } from '@/providers/types/Firefly.js';

function baseEvent(overrides: Partial<PolymarketSportsEvent> = {}): PolymarketSportsEvent {
    return {
        id: 'evt-1',
        slug: 'test-event',
        title: 'Test',
        volume: 1000,
        markets: [],
        ...overrides,
    } as PolymarketSportsEvent;
}

describe('collectSportsEventMarketAssetIds', () => {
    it('collects both outcome token ids for binary moneyline', () => {
        const event = baseEvent({
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    outcomes: '["Team A","Team B"]',
                    outcomePrices: '["0.4","0.6"]',
                    clobTokenIds: '["token-a","token-b"]',
                } as PolymarketSportsMarketData,
            ],
        });

        expect(collectSportsEventMarketAssetIds(event)).toEqual(['token-a', 'token-b']);
    });

    it('collects yes token ids for three-way draw games', () => {
        const event = baseEvent({
            isDraw: true,
            drawTeams: [{ name: 'Home' }, { name: 'Away' }],
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    groupTypeFF: 0,
                    clobTokenIds: '["home-yes"]',
                } as PolymarketSportsMarketData,
                {
                    sportsMarketType: 'moneyline',
                    groupTypeFF: 1,
                    clobTokenIds: '["draw-yes"]',
                } as PolymarketSportsMarketData,
                {
                    sportsMarketType: 'moneyline',
                    groupTypeFF: 2,
                    clobTokenIds: '["away-yes"]',
                } as PolymarketSportsMarketData,
            ],
        });

        expect(collectSportsEventMarketAssetIds(event)).toEqual(['home-yes', 'draw-yes', 'away-yes']);
    });
});

describe('collectLiveSportsMarketAssetIds', () => {
    it('only includes in-play events', () => {
        const live = baseEvent({
            id: 'live',
            game_status: 0,
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    clobTokenIds: '["live-token"]',
                    outcomes: '["A","B"]',
                    outcomePrices: '["0.5","0.5"]',
                } as PolymarketSportsMarketData,
            ],
        });
        const scheduled = baseEvent({
            id: 'soon',
            game_status: 1,
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    clobTokenIds: '["soon-token"]',
                    outcomes: '["A","B"]',
                    outcomePrices: '["0.5","0.5"]',
                } as PolymarketSportsMarketData,
            ],
        });

        expect(collectLiveSportsMarketAssetIds([live, scheduled])).toEqual(['live-token']);
    });
});

describe('resolveWsOutcomeDisplayPrice', () => {
    it('prefers best_ask over price', () => {
        expect(
            resolveWsOutcomeDisplayPrice({
                asset_id: '1',
                best_ask: '0.61',
                best_bid: '0.59',
                hash: '',
                price: '0.55',
                side: 'BUY',
                size: '1',
            }),
        ).toBe('0.61');
    });

    it('uses best_ask when it is 0', () => {
        expect(
            resolveWsOutcomeDisplayPrice({
                asset_id: '1',
                best_ask: '0',
                best_bid: '0.99',
                hash: '',
                price: '1',
                side: 'BUY',
                size: '1',
            }),
        ).toBe('0');
    });

    it('formats best_ask 1 as 0¢ after override', () => {
        expect(
            formatPriceCents(
                resolveWsOutcomeDisplayPrice({
                    asset_id: '1',
                    best_ask: '1',
                    best_bid: '0.99',
                    hash: '',
                    price: '0.99',
                    side: 'BUY',
                    size: '1',
                }),
            ),
        ).toBe('0¢');
    });
});

describe('collectSportsEventMarketAssetIds with array clobTokenIds', () => {
    it('parses clobTokenIds when API returns a real array', () => {
        const event = baseEvent({
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    clobTokenIds: ['token-a', 'token-b'],
                    outcomes: ['A', 'B'],
                    outcomePrices: [0.4, 0.6],
                } as unknown as PolymarketSportsMarketData,
            ],
        });

        expect(collectSportsEventMarketAssetIds(event)).toEqual(['token-a', 'token-b']);
    });
});

describe('applySportsMarketPriceOverrides', () => {
    it('updates displayed cents from websocket prices', () => {
        const event = baseEvent({
            game_status: 0,
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    outcomes: '["Team A","Team B"]',
                    outcomePrices: '["0.40","0.60"]',
                    clobTokenIds: '["token-a","token-b"]',
                    teams: [{ name: 'Team A' }, { name: 'Team B' }],
                    gameStartTime: '2026-05-20T22:00:00Z',
                } as PolymarketSportsMarketData,
            ],
        });

        const model = formatPolymarketSportsEventForUI(event);
        expect(model).not.toBeNull();

        const updated = applySportsMarketPriceOverrides(model!, {
            'token-a': '0.55',
            'token-b': '0.45',
        });

        expect(updated.homeTeam.priceCents).toBe('55¢');
        expect(updated.awayTeam.priceCents).toBe('45¢');
    });
});
