import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';

const FIFA_CATEGORY_SLUG = 'fifwc';

export const FIFA_EXCLUDE_TAG_ID = '100639';

export function isFifaCategoryContext(context: CategorySlugContext | null | undefined): boolean {
    if (!context) return false;
    return [context.primaryItem.slug, context.secondaryItem?.slug, context.activeItem.slug].includes(
        FIFA_CATEGORY_SLUG,
    );
}
