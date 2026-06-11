import { describe, expect, it } from 'vitest';

import { isFifaCategoryContext } from '@/helpers/prediction/category/isFifaCategoryContext.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug: [] };
}

describe('isFifaCategoryContext', () => {
    it('returns true when primary, secondary, or active slug is fifwc', () => {
        const sports = slugItem('sports');
        const fifwc = slugItem('fifwc');
        const winner = slugItem('winner');

        expect(
            isFifaCategoryContext({
                primaryItem: fifwc,
                activeItem: fifwc,
                depth: 1,
            }),
        ).toBe(true);

        expect(
            isFifaCategoryContext({
                primaryItem: sports,
                secondaryItem: fifwc,
                activeItem: fifwc,
                depth: 2,
            }),
        ).toBe(true);

        expect(
            isFifaCategoryContext({
                primaryItem: sports,
                secondaryItem: slugItem('outrights'),
                activeItem: winner,
                depth: 3,
            }),
        ).toBe(false);
    });

    it('returns false for missing or non-FIFA contexts', () => {
        const context: CategorySlugContext = {
            primaryItem: slugItem('sports'),
            secondaryItem: slugItem('nba'),
            activeItem: slugItem('nba'),
            depth: 2,
        };

        expect(isFifaCategoryContext(null)).toBe(false);
        expect(isFifaCategoryContext(context)).toBe(false);
    });
});
