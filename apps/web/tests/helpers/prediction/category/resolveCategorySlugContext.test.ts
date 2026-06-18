import { describe, expect, it } from 'vitest';

import { resolveCategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, sub_slug: PolymarketEventSlugListData[] = []): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug };
}

describe('resolveCategorySlugContext', () => {
    it('resolves a single-segment primary (depth 1)', () => {
        const slugs = [slugItem('trending'), slugItem('sports', [slugItem('live')])];

        const result = resolveCategorySlugContext(slugs, ['sports']);
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.activeItem.slug).toBe('sports');
        expect(result?.depth).toBe(1);
    });

    it('resolves a primary + secondary (depth 2)', () => {
        const slugs = [slugItem('sports', [slugItem('basketball')])];

        const result = resolveCategorySlugContext(slugs, ['sports', 'basketball']);
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.secondaryItem?.slug).toBe('basketball');
        expect(result?.activeItem.slug).toBe('basketball');
        expect(result?.depth).toBe(2);
    });

    it('resolves a primary + secondary + tertiary (depth 3)', () => {
        const slugs = [slugItem('sports', [slugItem('basketball', [slugItem('nba'), slugItem('cba')])])];

        const result = resolveCategorySlugContext(slugs, ['sports', 'basketball', 'nba']);
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.secondaryItem?.slug).toBe('basketball');
        expect(result?.activeItem.slug).toBe('nba');
        expect(result?.depth).toBe(3);
    });

    it('caps depth at 3, ignoring deeper segments', () => {
        const slugs = [slugItem('sports', [slugItem('basketball', [slugItem('nba')])])];

        const result = resolveCategorySlugContext(slugs, ['sports', 'basketball', 'nba', 'extra']);
        expect(result?.depth).toBe(3);
        expect(result?.activeItem.slug).toBe('nba');
    });

    it('disambiguates the shared `live` slug by path position', () => {
        // `live` exists under both Esports and Sports — only the path tells them apart.
        const slugs = [slugItem('esports', [slugItem('live')]), slugItem('sports', [slugItem('live')])];

        const esports = resolveCategorySlugContext(slugs, ['esports', 'live']);
        expect(esports?.primaryItem.slug).toBe('esports');
        expect(esports?.secondaryItem?.slug).toBe('live');
        expect(esports?.depth).toBe(2);

        const sports = resolveCategorySlugContext(slugs, ['sports', 'live']);
        expect(sports?.primaryItem.slug).toBe('sports');
        expect(sports?.depth).toBe(2);
    });

    it('distinguishes a top-level primary from its same-named dead sub-node (esports)', () => {
        // `esports` is a top-level primary AND a (dead, empty) sub-category of Sports.
        const slugs = [slugItem('esports', [slugItem('live')]), slugItem('sports', [slugItem('esports')])];

        const primary = resolveCategorySlugContext(slugs, ['esports']);
        expect(primary?.primaryItem.slug).toBe('esports');
        expect(primary?.activeItem.slug).toBe('esports');
        expect(primary?.depth).toBe(1);

        const subNode = resolveCategorySlugContext(slugs, ['sports', 'esports']);
        expect(subNode?.primaryItem.slug).toBe('sports');
        expect(subNode?.secondaryItem?.slug).toBe('esports');
        expect(subNode?.depth).toBe(2);
    });

    it('distinguishes a top-level primary from its nested occurrence (fifwc)', () => {
        const slugs = [slugItem('fifwc'), slugItem('sports', [slugItem('soccer', [slugItem('fifwc')])])];

        const top = resolveCategorySlugContext(slugs, ['fifwc']);
        expect(top?.depth).toBe(1);
        expect(top?.primaryItem.slug).toBe('fifwc');

        const nested = resolveCategorySlugContext(slugs, ['sports', 'soccer', 'fifwc']);
        expect(nested?.depth).toBe(3);
        expect(nested?.primaryItem.slug).toBe('sports');
        expect(nested?.secondaryItem?.slug).toBe('soccer');
        expect(nested?.activeItem.slug).toBe('fifwc');
    });

    it('returns null when the primary segment is unknown', () => {
        const slugs = [slugItem('sports', [slugItem('live')])];
        expect(resolveCategorySlugContext(slugs, ['unknown', 'live'])).toBeNull();
    });

    it('returns null when a secondary segment is unknown under a valid primary', () => {
        const slugs = [slugItem('sports', [slugItem('live')])];
        expect(resolveCategorySlugContext(slugs, ['sports', 'unknown'])).toBeNull();
    });

    it('returns null when a tertiary segment is unknown under a valid secondary', () => {
        const slugs = [slugItem('sports', [slugItem('basketball', [slugItem('nba')])])];
        expect(resolveCategorySlugContext(slugs, ['sports', 'basketball', 'unknown'])).toBeNull();
    });

    it('returns null for an empty path', () => {
        expect(resolveCategorySlugContext([slugItem('sports')], [])).toBeNull();
    });

    it('resolves a single-segment leaf slug via the legacy fallback (no ancestry in URL)', () => {
        // External "More" links target a leaf (a league like `nba`) with no primary in the path.
        const slugs = [slugItem('sports', [slugItem('basketball', [slugItem('nba')])])];

        const result = resolveCategorySlugContext(slugs, ['nba']);
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.secondaryItem?.slug).toBe('basketball');
        expect(result?.activeItem.slug).toBe('nba');
        expect(result?.depth).toBe(3);
    });

    it('prefers a secondary over a same-named tertiary in the legacy fallback', () => {
        const slugs = [
            slugItem('sports', [slugItem('nba'), slugItem('basketball', [slugItem('nba'), slugItem('cba')])]),
        ];

        const result = resolveCategorySlugContext(slugs, ['nba']);
        expect(result?.depth).toBe(2);
        expect(result?.secondaryItem?.slug).toBe('nba');
    });

    it('returns null for an unknown single-segment slug', () => {
        expect(resolveCategorySlugContext([slugItem('sports')], ['nope'])).toBeNull();
    });
});
