import { partitionPrimaryCategorySlugs } from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

/** Flat list: leading slugs (trending, new) then the rest in API order. */
export function orderPrimaryCategorySlugs(slugs: PolymarketEventSlugListData[]): PolymarketEventSlugListData[] {
    const { leading, main } = partitionPrimaryCategorySlugs(slugs);
    return [...leading, ...main];
}
