import { PINNED_PRIMARY_SLUGS, SPORTS_CATEGORY_TYPES } from '@/helpers/prediction/category/constants.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export function shouldShowGamesTab(item: PolymarketEventSlugListData | null | undefined): boolean {
    if (!item) return false;
    if ((PINNED_PRIMARY_SLUGS as readonly string[]).includes(item.slug)) {
        return false;
    }
    if (item.type && SPORTS_CATEGORY_TYPES.has(item.type)) {
        return true;
    }
    return item.slug === 'live';
}

/** Sports/Live shows games list only — no Games vs Props tab switcher. */
export function shouldShowGamesPropsTabs(context: CategorySlugContext): boolean {
    if (!shouldShowGamesTab(context.activeItem)) return false;
    return !isSportsLiveCategoryContext(context);
}
