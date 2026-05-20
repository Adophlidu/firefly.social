import { partitionSecondaryCategorySlugs } from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

/** First secondary tab in nav order (leading chips, then main). */
export function getDefaultSecondaryCategoryItem(
    primary: PolymarketEventSlugListData,
): PolymarketEventSlugListData | undefined {
    const items = primary.sub_slug;
    if (!items?.length) return undefined;

    const { leading, main } = partitionSecondaryCategorySlugs(items);
    return leading[0] ?? main[0];
}
