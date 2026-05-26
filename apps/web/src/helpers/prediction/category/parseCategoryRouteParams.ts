import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketSportsListRequest } from '@/providers/types/Firefly.js';

export interface CategoryRouteSearchParams {
    tagType?: string | null;
    parentSlug?: string | null;
    parentTagType?: string | null;
}

export function parseLiveSportsListRequest(context: CategorySlugContext): PolymarketSportsListRequest {
    const { activeItem } = context;

    return {
        children_tag_slug: activeItem.slug_tag || activeItem.slug,
        children_tag_slug_type: activeItem.type || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
}

export function parseSportsListRequest(
    context: CategorySlugContext,
    searchParams?: CategoryRouteSearchParams,
): PolymarketSportsListRequest {
    const { activeItem, secondaryItem, primaryItem, depth } = context;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (depth === 3 && secondaryItem) {
        return {
            children_tag_slug: secondaryItem.slug_tag || secondaryItem.slug,
            children_tag_slug_type: secondaryItem.type || searchParams?.parentTagType || undefined,
            children_children_tag_slug: activeItem.slug_tag || activeItem.slug,
            children_children_tag_slug_type: activeItem.type || searchParams?.tagType || undefined,
            timezone,
        };
    }

    if (depth === 2) {
        return {
            children_tag_slug: activeItem.slug_tag || activeItem.slug,
            children_tag_slug_type: activeItem.type || searchParams?.tagType || undefined,
            timezone,
        };
    }

    return {
        children_tag_slug: activeItem.slug_tag || activeItem.slug,
        children_tag_slug_type: activeItem.type || searchParams?.tagType || undefined,
        timezone,
    };
}

export function getCategoryPropsTagSlug(context: CategorySlugContext): string | undefined {
    const tagSlug = context.activeItem.slug_tag?.trim();
    return tagSlug || undefined;
}

export function getPropsListSlugParams(context: CategorySlugContext): { slug: string; subSlug?: string } {
    const { activeItem, primaryItem, depth } = context;

    if (depth >= 2) {
        return {
            slug: primaryItem.slug,
            subSlug: activeItem.slug,
        };
    }

    return { slug: activeItem.slug };
}
