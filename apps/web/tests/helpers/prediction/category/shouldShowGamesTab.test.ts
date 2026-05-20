import { describe, expect, it } from 'vitest';

import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs, shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, type?: string): PolymarketEventSlugListData {
    return { slug, label: slug, type, sub_slug: [] };
}

describe('shouldShowGamesTab', () => {
    it('returns true for sports-type categories and live slug', () => {
        expect(shouldShowGamesTab(slugItem('nba', 'league'))).toBe(true);
        expect(shouldShowGamesTab(slugItem('live'))).toBe(true);
    });

    it('returns false for pinned primary slugs', () => {
        expect(shouldShowGamesTab(slugItem('trending'))).toBe(false);
    });
});

describe('shouldShowGamesPropsTabs', () => {
    it('hides Games/Props tabs on Sports/Live', () => {
        const live = slugItem('live', 'live');
        const sports = slugItem('sports', 'sport');
        const context: CategorySlugContext = {
            depth: 2,
            primaryItem: sports,
            secondaryItem: live,
            activeItem: live,
        };

        expect(shouldShowGamesPropsTabs(context)).toBe(false);
    });

    it('shows Games/Props tabs for other sports secondaries', () => {
        const nba = slugItem('nba', 'league');
        const sports = slugItem('sports', 'sport');
        const context: CategorySlugContext = {
            depth: 2,
            primaryItem: sports,
            secondaryItem: nba,
            activeItem: nba,
        };

        expect(shouldShowGamesPropsTabs(context)).toBe(true);
    });
});
