import { describe, expect, it } from 'vitest';

import {
    categoryHasGamesDisplayContent,
    categoryHasPropsDisplayContent,
    resolveCategoryGamesPropsTabs,
} from '@/helpers/prediction/category/categoryGamesPropsTabAvailability.js';
import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
} from '@/helpers/prediction/category/constants.js';
import type {
    PolymarketEventListData,
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketSportsMarketData,
} from '@/providers/types/Firefly.js';

function sportsEvent(id: string): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Home","Away"]',
                outcomePrices: '["0.4","0.6"]',
                clobTokenIds: '["token-home","token-away"]',
            } as PolymarketSportsMarketData,
        ],
    } as PolymarketSportsEvent;
}

function emptySportsResponse(): PolymarketSportsListResponse {
    return {
        live: [],
        today: [],
        tomorrow: [],
        afterTomorrow: [],
        closed: [],
        timezone: 'UTC',
    };
}

describe('categoryHasGamesDisplayContent', () => {
    it('returns false for empty response', () => {
        expect(categoryHasGamesDisplayContent(emptySportsResponse())).toBe(false);
        expect(categoryHasGamesDisplayContent(undefined)).toBe(false);
    });

    it('returns true when dated sections or closed events exist', () => {
        expect(
            categoryHasGamesDisplayContent({
                ...emptySportsResponse(),
                today: [sportsEvent('today-1')],
            }),
        ).toBe(true);

        expect(
            categoryHasGamesDisplayContent({
                ...emptySportsResponse(),
                closed: [sportsEvent('closed-1')],
            }),
        ).toBe(true);
    });
});

describe('categoryHasPropsDisplayContent', () => {
    it('returns false for empty events', () => {
        expect(categoryHasPropsDisplayContent([])).toBe(false);
        expect(categoryHasPropsDisplayContent(undefined)).toBe(false);
    });

    it('returns true when events exist', () => {
        expect(categoryHasPropsDisplayContent([{ id: '1' } as PolymarketEventListData])).toBe(true);
    });
});

describe('resolveCategoryGamesPropsTabs', () => {
    it('returns no switcher when showGamesPropsTabs is false', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: false,
            hasGames: true,
            hasProps: true,
            tabFromUrl: PREDICTION_CATEGORY_PROPS_TAB,
        });

        expect(result.availableTabs).toEqual([]);
        expect(result.showTabSwitcher).toBe(false);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_PROPS_TAB);
    });

    it('shows switcher when both sides have data', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: true,
            hasProps: true,
            tabFromUrl: PREDICTION_CATEGORY_PROPS_TAB,
        });

        expect(result.availableTabs).toEqual([PREDICTION_CATEGORY_GAMES_TAB, PREDICTION_CATEGORY_PROPS_TAB]);
        expect(result.showTabSwitcher).toBe(true);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_PROPS_TAB);
    });

    it('hides switcher and snaps to games when only games has data', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: true,
            hasProps: false,
            tabFromUrl: PREDICTION_CATEGORY_PROPS_TAB,
        });

        expect(result.availableTabs).toEqual([PREDICTION_CATEGORY_GAMES_TAB]);
        expect(result.showTabSwitcher).toBe(false);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_GAMES_TAB);
    });

    it('hides switcher and snaps to props when only props has data', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: false,
            hasProps: true,
            tabFromUrl: PREDICTION_CATEGORY_GAMES_TAB,
        });

        expect(result.availableTabs).toEqual([PREDICTION_CATEGORY_PROPS_TAB]);
        expect(result.showTabSwitcher).toBe(false);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_PROPS_TAB);
    });

    it('hides switcher and defaults to games when neither side has data', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: false,
            hasProps: false,
            tabFromUrl: PREDICTION_CATEGORY_PROPS_TAB,
        });

        expect(result.availableTabs).toEqual([]);
        expect(result.showTabSwitcher).toBe(false);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_GAMES_TAB);
    });

    it('hides switcher while availability is pending', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: true,
            hasProps: true,
            tabFromUrl: PREDICTION_CATEGORY_GAMES_TAB,
            isAvailabilityPending: true,
        });

        expect(result.showTabSwitcher).toBe(false);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_GAMES_TAB);
    });

    it('does not treat partial availability as both tabs when pending', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: false,
            hasProps: false,
            tabFromUrl: PREDICTION_CATEGORY_PROPS_TAB,
            isAvailabilityPending: true,
        });

        expect(result.availableTabs).toEqual([]);
        expect(result.showTabSwitcher).toBe(false);
    });
});
