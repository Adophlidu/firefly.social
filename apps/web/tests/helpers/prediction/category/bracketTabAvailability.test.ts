import { describe, expect, it } from 'vitest';

import { resolveCategoryGamesPropsTabs } from '@/helpers/prediction/category/categoryGamesPropsTabAvailability.js';
import {
    PREDICTION_CATEGORY_BRACKET_TAB,
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_GROUPS_TAB,
} from '@/helpers/prediction/category/constants.js';

describe('resolveCategoryGamesPropsTabs — bracket', () => {
    it('appends bracket after groups when hasBracket', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: true,
            hasGames: true,
            hasProps: false,
            hasGroups: true,
            hasBracket: true,
            tabFromUrl: PREDICTION_CATEGORY_GAMES_TAB,
        });
        expect(result.availableTabs).toEqual([
            PREDICTION_CATEGORY_GAMES_TAB,
            PREDICTION_CATEGORY_GROUPS_TAB,
            PREDICTION_CATEGORY_BRACKET_TAB,
        ]);
    });

    it('keeps bracket selectable in the non-sports branch', () => {
        const result = resolveCategoryGamesPropsTabs({
            showGamesPropsTabs: false,
            hasGames: false,
            hasProps: false,
            hasGroups: true,
            hasBracket: true,
            tabFromUrl: PREDICTION_CATEGORY_BRACKET_TAB,
        });
        expect(result.availableTabs).toContain(PREDICTION_CATEGORY_BRACKET_TAB);
        expect(result.effectiveTab).toBe(PREDICTION_CATEGORY_BRACKET_TAB);
    });
});
