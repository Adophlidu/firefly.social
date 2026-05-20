import { describe, expect, it } from 'vitest';

import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, sub_slug: PolymarketEventSlugListData[] = []): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug };
}

describe('getDefaultSecondaryCategoryItem', () => {
    it('returns undefined when primary has no secondary slugs', () => {
        expect(getDefaultSecondaryCategoryItem(slugItem('trending'))).toBeUndefined();
    });

    it('returns the first main secondary when no leading slugs', () => {
        const primary = slugItem('sports', [slugItem('nba'), slugItem('nfl')]);
        expect(getDefaultSecondaryCategoryItem(primary)?.slug).toBe('nba');
    });

    it('returns leading secondary before main (e.g. live)', () => {
        const primary = slugItem('sports', [slugItem('nba'), slugItem('live'), slugItem('nfl')]);
        expect(getDefaultSecondaryCategoryItem(primary)?.slug).toBe('live');
    });
});
