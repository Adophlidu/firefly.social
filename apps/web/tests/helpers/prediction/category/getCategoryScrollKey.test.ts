import { describe, expect, it } from 'vitest';

import { getSecondaryCategoryScrollKey } from '@/helpers/prediction/category/getCategoryScrollKey.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug: [] };
}

function context(partial: Partial<CategorySlugContext> & Pick<CategorySlugContext, 'depth'>): CategorySlugContext {
    const primary = slugItem('sports');
    const secondary = slugItem('basketball');
    const tertiary = slugItem('nba');
    return {
        primaryItem: primary,
        activeItem: primary,
        ...partial,
    };
}

describe('getSecondaryCategoryScrollKey', () => {
    it('returns active slug at depth 2', () => {
        const nba = slugItem('nba');
        expect(
            getSecondaryCategoryScrollKey(
                context({
                    depth: 2,
                    secondaryItem: nba,
                    activeItem: nba,
                }),
            ),
        ).toBe('nba');
    });

    it('returns secondary slug at depth 3', () => {
        const basketball = slugItem('basketball');
        const nba = slugItem('nba');
        expect(
            getSecondaryCategoryScrollKey(
                context({
                    depth: 3,
                    secondaryItem: basketball,
                    activeItem: nba,
                }),
            ),
        ).toBe('basketball');
    });

    it('returns null at depth 1', () => {
        expect(getSecondaryCategoryScrollKey(context({ depth: 1 }))).toBeNull();
    });
});
