import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export function buildPredictionCategoryHref(item: PolymarketEventSlugListData, parent?: PolymarketEventSlugListData) {
    return RouteResolver.predictionCategory({
        slug: item.slug,
        tagType: item.type,
        parentSlug: parent?.slug,
        parentTagType: parent?.type,
        appendRoot: false,
    });
}

/** Primary tab target: first secondary when the primary has sub-categories. */
export function buildPredictionCategoryHrefForPrimary(primary: PolymarketEventSlugListData) {
    const secondary = getDefaultSecondaryCategoryItem(primary);
    return buildPredictionCategoryHref(secondary ?? primary);
}
