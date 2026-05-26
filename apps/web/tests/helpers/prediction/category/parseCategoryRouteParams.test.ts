import { describe, expect, it } from 'vitest';

import {
    getCategoryPropsTagSlug,
    getPropsListSlugParams,
    parseLiveSportsListRequest,
    parseSportsListRequest,
} from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(
    slug: string,
    type?: string,
    sub_slug: PolymarketEventSlugListData[] = [],
    slug_tag?: string,
): PolymarketEventSlugListData {
    return { slug, label: slug, type, sub_slug, slug_tag };
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

describe('parseLiveSportsListRequest', () => {
    it('requests live sports list with local timezone', () => {
        const live = slugItem('live', 'live', [], 'live-tag');
        const basketball = slugItem('basketball', 'sport');
        const sports = slugItem('sports', 'sport', [live, basketball]);

        const request = parseLiveSportsListRequest(
            context({
                depth: 2,
                primaryItem: sports,
                secondaryItem: live,
                activeItem: live,
            }),
        );

        expect(request).toEqual({
            children_tag_slug: 'live-tag',
            children_tag_slug_type: 'live',
            timezone: expect.any(String),
        });
        expect(request.children_tag_slug).toBe('live-tag');
    });
});

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

describe('getPropsListSlugParams', () => {
    it('sends primary and active slug at depth 2+', () => {
        const nba = slugItem('nba', 'league');
        const sports = slugItem('sports', 'sport', [nba]);

        expect(
            getPropsListSlugParams(
                context({
                    depth: 2,
                    primaryItem: sports,
                    secondaryItem: nba,
                    activeItem: nba,
                }),
            ),
        ).toEqual({ slug: 'sports', subSlug: 'nba' });
    });

    it('sends only active slug at depth 1', () => {
        const politics = slugItem('politics');

        expect(
            getPropsListSlugParams(
                context({
                    depth: 1,
                    primaryItem: politics,
                    activeItem: politics,
                }),
            ),
        ).toEqual({ slug: 'politics' });
    });
});

describe('getCategoryPropsTagSlug', () => {
    it('returns trimmed slug_tag from active item', () => {
        const active = slugItem('nba', 'league', [], '  nba-props  ');

        expect(
            getCategoryPropsTagSlug(
                context({
                    depth: 2,
                    activeItem: active,
                }),
            ),
        ).toBe('nba-props');
    });

    it('returns undefined when slug_tag is missing or blank', () => {
        const withoutTag = slugItem('nba', 'league');

        expect(
            getCategoryPropsTagSlug(
                context({
                    depth: 2,
                    activeItem: withoutTag,
                }),
            ),
        ).toBeUndefined();

        expect(
            getCategoryPropsTagSlug(
                context({
                    depth: 2,
                    activeItem: slugItem('nba', 'league', [], '   '),
                }),
            ),
        ).toBeUndefined();
    });

    it('does not fall back to slug when slug_tag is absent', () => {
        const active = slugItem('nba', 'league');

        expect(
            getCategoryPropsTagSlug(
                context({
                    depth: 2,
                    activeItem: active,
                }),
            ),
        ).toBeUndefined();
    });
});
