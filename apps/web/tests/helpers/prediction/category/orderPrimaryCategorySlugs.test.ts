import { describe, expect, it } from 'vitest';

import { orderPrimaryCategorySlugs } from '@/helpers/prediction/category/orderPrimaryCategorySlugs.js';
import {
    partitionPrimaryCategorySlugs,
    partitionSecondaryCategorySlugs,
} from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, label = slug): PolymarketEventSlugListData {
    return { slug, label, sub_slug: [] };
}

describe('orderPrimaryCategorySlugs', () => {
    it('pins trending and new before the divider group when all exist', () => {
        const input = [
            slugItem('politics'),
            slugItem('new'),
            slugItem('sports'),
            slugItem('trending'),
            slugItem('breaking'),
        ];
        const result = orderPrimaryCategorySlugs(input);
        expect(result.map((item) => item.slug)).toEqual(['trending', 'new', 'politics', 'sports', 'breaking']);
    });

    it('omits leading slugs that are missing from the API', () => {
        const input = [slugItem('politics'), slugItem('trending')];
        const result = orderPrimaryCategorySlugs(input);
        expect(result.map((item) => item.slug)).toEqual(['trending', 'politics']);
    });

    it('does not duplicate slugs', () => {
        const input = [slugItem('trending'), slugItem('trending'), slugItem('sports')];
        const result = orderPrimaryCategorySlugs(input);
        expect(result.filter((item) => item.slug === 'trending')).toHaveLength(1);
    });
});

describe('partitionPrimaryCategorySlugs', () => {
    it('splits leading and main groups for UI dividers', () => {
        const input = [slugItem('politics'), slugItem('new'), slugItem('trending'), slugItem('breaking')];
        const { leading, main } = partitionPrimaryCategorySlugs(input);
        expect(leading.map((item) => item.slug)).toEqual(['trending', 'new']);
        expect(main.map((item) => item.slug)).toEqual(['politics', 'breaking']);
    });
});

describe('partitionSecondaryCategorySlugs', () => {
    it('pins live before the divider group', () => {
        const input = [slugItem('nba'), slugItem('live'), slugItem('nhl')];
        const { leading, main } = partitionSecondaryCategorySlugs(input);
        expect(leading.map((item) => item.slug)).toEqual(['live']);
        expect(main.map((item) => item.slug)).toEqual(['nba', 'nhl']);
    });
});
