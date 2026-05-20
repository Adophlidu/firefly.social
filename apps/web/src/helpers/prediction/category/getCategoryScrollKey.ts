import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';

export const PREDICTION_CATEGORY_SCROLL_KEY_ATTR = 'data-prediction-category-scroll-key';

/** Slug of the secondary row item that should stay centered in the horizontal nav. */
export function getSecondaryCategoryScrollKey(context: CategorySlugContext): string | null {
    if (context.depth === 2) return context.activeItem.slug;
    if (context.depth === 3) return context.secondaryItem?.slug ?? null;
    return null;
}
