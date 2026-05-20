import { RouteResolver } from '@/helpers/RouteResolver.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export function buildPredictionCategoryHref(item: PolymarketEventSlugListData) {
    return RouteResolver.predictionCategory({
        slug: item.slug,
        tagType: item.type,
        appendRoot: false,
    });
}
