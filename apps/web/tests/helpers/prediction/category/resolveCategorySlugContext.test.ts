import { describe, expect, it } from 'vitest';

import { resolveCategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, sub_slug: PolymarketEventSlugListData[] = []): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug };
}

describe('resolveCategorySlugContext', () => {
    it('resolves a root slug', () => {
        const slugs = [slugItem('trending'), slugItem('sports', [slugItem('nba', [])])];
        const result = resolveCategorySlugContext(slugs, 'sports');
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.activeItem.slug).toBe('sports');
        expect(result?.depth).toBe(1);
    });

    it('resolves a secondary slug under a primary', () => {
        const slugs = [slugItem('sports', [slugItem('nba', [])])];
        const result = resolveCategorySlugContext(slugs, 'nba');
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.secondaryItem?.slug).toBe('nba');
        expect(result?.activeItem.slug).toBe('nba');
        expect(result?.depth).toBe(2);
    });

    it('resolves a tertiary slug under secondary', () => {
        const slugs = [slugItem('sports', [slugItem('basketball', [slugItem('nba', []), slugItem('cba', [])])])];
        const result = resolveCategorySlugContext(slugs, 'nba');
        expect(result?.primaryItem.slug).toBe('sports');
        expect(result?.secondaryItem?.slug).toBe('basketball');
        expect(result?.activeItem.slug).toBe('nba');
        expect(result?.depth).toBe(3);
    });

    it('returns null when slug is unknown', () => {
        const slugs = [slugItem('trending')];
        expect(resolveCategorySlugContext(slugs, 'unknown')).toBeNull();
    });
});
