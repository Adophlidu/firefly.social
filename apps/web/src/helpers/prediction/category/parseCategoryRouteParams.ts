import { ESPORTS_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketSportsListRequest } from '@/providers/types/Firefly.js';

export function parseLiveSportsListRequest(context: CategorySlugContext): PolymarketSportsListRequest {
    const { activeItem, primaryItem } = context;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // The Esports "Live" view aggregates every esports game. The backend cannot scope the
    // shared `live` branch to esports, so we fetch all esports via the esports primary tag
    // (bucketed into live/today/tomorrow) instead of the generic sports `live` bucket.
    if (primaryItem.slug === ESPORTS_PRIMARY_SLUG) {
        return {
            children_tag_slug: primaryItem.slug,
            children_tag_slug_type: primaryItem.type ?? 'sport',
            timezone,
        };
    }

    return {
        children_tag_slug: activeItem.slug,
        children_tag_slug_type: activeItem.type || undefined,
        timezone,
    };
}

export function parseSportsListRequest(context: CategorySlugContext): PolymarketSportsListRequest {
    const { activeItem, secondaryItem, depth } = context;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (depth === 3 && secondaryItem) {
        return {
            children_tag_slug: secondaryItem.slug,
            children_tag_slug_type: secondaryItem.type || undefined,
            children_children_tag_slug: activeItem.slug,
            children_children_tag_slug_type: activeItem.type || undefined,
            timezone,
        };
    }

    return {
        children_tag_slug: activeItem.slug,
        children_tag_slug_type: activeItem.type || undefined,
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
