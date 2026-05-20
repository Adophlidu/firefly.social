import { describe, expect, it } from 'vitest';

import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug: [] };
}

describe('isSportsLiveCategoryContext', () => {
    it('returns true when the active secondary slug is live', () => {
        const live = slugItem('live');
        const sports = slugItem('sports');

        expect(
            isSportsLiveCategoryContext({
                depth: 2,
                primaryItem: sports,
                secondaryItem: live,
                activeItem: live,
            }),
        ).toBe(true);
    });

    it('returns false for other secondary slugs', () => {
        const nba = slugItem('nba');
        const sports = slugItem('sports');

        expect(
            isSportsLiveCategoryContext({
                depth: 2,
                primaryItem: sports,
                secondaryItem: nba,
                activeItem: nba,
            }),
        ).toBe(false);
    });
});
