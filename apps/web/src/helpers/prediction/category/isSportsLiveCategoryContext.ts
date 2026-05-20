import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';

export function isSportsLiveCategoryContext(context: CategorySlugContext): boolean {
    const slug = context.activeItem.slug_tag || context.activeItem.slug;
    return slug === 'live';
}
