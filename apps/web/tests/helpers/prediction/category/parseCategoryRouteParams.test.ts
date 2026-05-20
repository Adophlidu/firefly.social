import { describe, expect, it } from 'vitest';

import { parseSportsListRequest } from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(
    slug: string,
    type?: string,
    sub_slug: PolymarketEventSlugListData[] = [],
): PolymarketEventSlugListData {
    return { slug, label: slug, type, sub_slug };
}

function context(overrides: Partial<CategorySlugContext> & Pick<CategorySlugContext, 'depth'>): CategorySlugContext {
    const primary = overrides.primaryItem ?? slugItem('sports', 'sport');
    const secondary = overrides.secondaryItem;
    const active = overrides.activeItem ?? primary;

    return {
        primaryItem: primary,
        secondaryItem: secondary,
        activeItem: active,
        depth: overrides.depth,
    };
}

describe('parseSportsListRequest', () => {
    it('sends only secondary slug at depth 2', () => {
        const nba = slugItem('nba', 'league');
        const sports = slugItem('sports', 'sport', [nba]);

        const request = parseSportsListRequest(
            context({
                depth: 2,
                primaryItem: sports,
                secondaryItem: nba,
                activeItem: nba,
            }),
        );

        expect(request).toEqual({
            children_tag_slug: 'nba',
            children_tag_slug_type: 'league',
            timezone: expect.any(String),
        });
        expect(request).not.toHaveProperty('children_children_tag_slug');
        expect(request).not.toHaveProperty('children_children_tag_slug_type');
    });

    it('maps secondary and tertiary slugs at depth 3', () => {
        const nba = slugItem('nba', 'league');
        const basketball = slugItem('basketball', 'sport', [nba]);
        const sports = slugItem('sports', 'sport', [basketball]);

        const request = parseSportsListRequest(
            context({
                depth: 3,
                primaryItem: sports,
                secondaryItem: basketball,
                activeItem: nba,
            }),
        );

        expect(request.children_tag_slug).toBe('basketball');
        expect(request.children_tag_slug_type).toBe('sport');
        expect(request.children_children_tag_slug).toBe('nba');
        expect(request.children_children_tag_slug_type).toBe('league');
    });

    it('sends only primary slug at depth 1', () => {
        const sports = slugItem('sports', 'sport');

        const request = parseSportsListRequest(
            context({
                depth: 1,
                primaryItem: sports,
                activeItem: sports,
            }),
        );

        expect(request.children_tag_slug).toBe('sports');
        expect(request.children_tag_slug_type).toBe('sport');
        expect(request.children_children_tag_slug).toBeUndefined();
    });
});
