import { describe, expect, it } from 'vitest';

import {
    formatPolymarketSportsEventForUI,
    formatPriceCents,
    normalizeSportsOutcomeDisplayPrice,
    parseSportsPriceCentsLabel,
    resolveSportsLivestreamUrl,
} from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import type { PolymarketSportsEvent, PolymarketSportsMarketData } from '@/providers/types/Firefly.js';

function baseEvent(overrides: Partial<PolymarketSportsEvent> = {}): PolymarketSportsEvent {
    return {
        id: 'evt-1',
        slug: 'test-event',
        title: 'Test',
        volume: 1000,
        volume24hr: 500,
        startDate: '2026-05-20T22:00:00Z',
        markets: [],
        ...overrides,
    } as PolymarketSportsEvent;
}

describe('normalizeSportsOutcomeDisplayPrice', () => {
    it('maps probability >= 1 to 0 for Polymarket buy-side display', () => {
        expect(normalizeSportsOutcomeDisplayPrice(1)).toBe(0);
        expect(normalizeSportsOutcomeDisplayPrice(1.0001)).toBe(0);
        expect(normalizeSportsOutcomeDisplayPrice(0.89)).toBe(0.89);
    });
});

describe('formatPriceCents', () => {
    it('drops trailing zeros before the cent sign', () => {
        expect(formatPriceCents('0.89')).toBe('89¢');
        expect(formatPriceCents('0.455')).toBe('45.5¢');
    });

    it('shows 0¢ when probability is 1.0 (matches Polymarket buy buttons)', () => {
        expect(formatPriceCents('1')).toBe('0¢');
        expect(formatPriceCents('1.0')).toBe('0¢');
        expect(formatPriceCents('0')).toBe('0¢');
    });
});

describe('parseSportsPriceCentsLabel', () => {
    it('splits amount and unit for animated price display', () => {
        expect(parseSportsPriceCentsLabel('89¢')).toEqual({ amount: '89', unit: '¢' });
        expect(parseSportsPriceCentsLabel('—')).toEqual({ amount: '—' });
    });
});

describe('resolveSportsLivestreamUrl', () => {
    it('prefers player_url, then livestream_url', () => {
        expect(
            resolveSportsLivestreamUrl({
                livestream_url: 'https://www.conmebol.com/sudamericana/',
                player_url: '',
                in_whitelist: false,
            }),
        ).toBe('https://www.conmebol.com/sudamericana/');

        expect(
            resolveSportsLivestreamUrl({
                livestream_url: 'https://twitch.tv/foo',
                player_url: 'https://player.twitch.tv/foo',
                in_whitelist: true,
            }),
        ).toBe('https://player.twitch.tv/foo');
    });
});

describe('formatPolymarketSportsEventForUI', () => {
    it('formats a three-way draw game with stacked outcome buttons', () => {
        const event = baseEvent({
            isDraw: true,
            game_status: 1,
            leagueName: 'EPL',
            drawTeams: [
                {
                    name: 'Arsenal',
                    abbreviation: 'ARS',
                    color: '#EF0107',
                },
                {
                    name: 'Chelsea',
                    abbreviation: 'CHE',
                    color: '#034694',
                },
            ],
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    slug: 'arsenal-win',
                    groupItemTitle: 'Arsenal',
                    groupTypeFF: 0,
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.45","0.55"]',
                    gameStartTime: '2026-05-20T22:00:00Z',
                },
                {
                    sportsMarketType: 'moneyline',
                    slug: 'draw-ars-chel',
                    groupItemTitle: 'Draw (Arsenal vs. Chelsea)',
                    groupTypeFF: 1,
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.28","0.72"]',
                },
                {
                    sportsMarketType: 'moneyline',
                    slug: 'chelsea-win',
                    groupItemTitle: 'Chelsea',
                    groupTypeFF: 2,
                    outcomes: '["Yes","No"]',
                    outcomePrices: '["0.32","0.68"]',
                },
            ] as PolymarketSportsMarketData[],
        });

        const model = formatPolymarketSportsEventForUI(event);

        expect(model).not.toBeNull();
        expect(model?.layout).toBe('threeWay');
        expect(model?.homeTeam.abbreviation).toBe('ARS');
        expect(model?.homeTeam.name).toBe('Arsenal');
        expect(model?.homeTeam.priceCents).toBe('45¢');
        expect(model?.homeTeam.marketSlug).toBe('arsenal-win');
        expect(model?.homeTeam.outcomeIndex).toBe(0);
        expect(model?.awayTeam.priceCents).toBe('32¢');
        expect(model?.awayTeam.marketSlug).toBe('chelsea-win');
        expect(model?.drawOutcome?.priceCents).toBe('28¢');
        expect(model?.drawOutcome?.marketSlug).toBe('draw-ars-chel');
        expect(model?.scheduledTimeLabel).toBeTruthy();
    });

    it('maps livestream_info.livestream_url for live games', () => {
        const event = baseEvent({
            game_status: 0,
            livestream_info: {
                livestream_url: 'https://www.conmebol.com/sudamericana/',
                player_url: '',
                in_whitelist: false,
            },
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    outcomes: '["A","B"]',
                    outcomePrices: '["0.5","0.5"]',
                    teams: [{ name: 'A' }, { name: 'B' }],
                },
            ] as PolymarketSportsMarketData[],
        });

        expect(formatPolymarketSportsEventForUI(event)?.livestreamUrl).toBe('https://www.conmebol.com/sudamericana/');
    });

    it('prefers alias over name for team display label', () => {
        const event = baseEvent({
            game_status: 1,
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    outcomes: '["Long Team Name","Other"]',
                    outcomePrices: '["0.5","0.5"]',
                    gameStartTime: '2026-05-20T22:00:00Z',
                    teams: [{ name: 'Long Team Name', alias: 'LTN' }, { name: 'Other' }],
                },
            ] as PolymarketSportsMarketData[],
        });

        const model = formatPolymarketSportsEventForUI(event);
        expect(model?.homeTeam.name).toBe('LTN');
        expect(model?.awayTeam.name).toBe('Other');
    });

    it('falls back to binary layout when isDraw is false', () => {
        const event = baseEvent({
            isDraw: false,
            game_status: 1,
            markets: [
                {
                    sportsMarketType: 'moneyline',
                    slug: 'arsenal-chelsea-ml',
                    outcomes: '["Arsenal","Chelsea"]',
                    outcomePrices: '["0.45","0.55"]',
                    gameStartTime: '2026-05-20T22:00:00Z',
                    teams: [{ name: 'Arsenal' }, { name: 'Chelsea' }],
                },
            ] as PolymarketSportsMarketData[],
        });

        const model = formatPolymarketSportsEventForUI(event);

        expect(model?.layout).toBe('binary');
        expect(model?.drawOutcome).toBeUndefined();
        expect(model?.homeTeam.marketSlug).toBe('arsenal-chelsea-ml');
        expect(model?.homeTeam.outcomeIndex).toBe(0);
        expect(model?.awayTeam.outcomeIndex).toBe(1);
    });
});
