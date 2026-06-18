import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

/**
 * Build a category href whose path mirrors the slug tree: `/<ancestor slugs>/<item.slug>`.
 *
 * `ancestors` is the chain of parents from outermost to innermost (e.g. `[primary]` for a
 * secondary, `[primary, secondary]` for a tertiary). Position in the path disambiguates slugs that
 * recur at different depths, so no query param is needed.
 */
export function buildPredictionCategoryHref(
    item: PolymarketEventSlugListData,
    ancestors: PolymarketEventSlugListData[] = [],
) {
    return RouteResolver.predictionCategory({
        slugs: [...ancestors.map((ancestor) => ancestor.slug), item.slug],
        appendRoot: false,
    });
}

/** Primary tab target: lands on its default secondary (`/primary/defaultSecondary`) when present. */
export function buildPredictionCategoryHrefForPrimary(primary: PolymarketEventSlugListData) {
    const secondary = getDefaultSecondaryCategoryItem(primary);
    if (!secondary) return buildPredictionCategoryHref(primary);
    return buildPredictionCategoryHref(secondary, [primary]);
}
