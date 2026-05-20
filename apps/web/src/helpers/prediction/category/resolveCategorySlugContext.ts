import type { CategoryRouteSearchParams } from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export type CategorySlugDepth = 1 | 2 | 3;

export interface CategorySlugContext {
    primaryItem: PolymarketEventSlugListData;
    secondaryItem?: PolymarketEventSlugListData;
    activeItem: PolymarketEventSlugListData;
    depth: CategorySlugDepth;
}

function matchesParentTagType(secondary: PolymarketEventSlugListData, parentTagType?: string | null): boolean {
    if (!parentTagType) return true;
    return secondary.type === parentTagType;
}

function resolveTertiaryUnderParent(
    slugs: PolymarketEventSlugListData[],
    routeSlug: string,
    parentSlug: string,
    parentTagType?: string | null,
): CategorySlugContext | null {
    for (const primary of slugs) {
        for (const secondary of primary.sub_slug ?? []) {
            if (secondary.slug !== parentSlug) continue;
            if (!matchesParentTagType(secondary, parentTagType)) continue;

            const tertiary = secondary.sub_slug?.find((item) => item.slug === routeSlug);
            if (!tertiary) continue;

            return {
                primaryItem: primary,
                secondaryItem: secondary,
                activeItem: tertiary,
                depth: 3,
            };
        }
    }

    return null;
}

export function resolveCategorySlugContext(
    slugs: PolymarketEventSlugListData[],
    routeSlug: string,
    routeParams?: CategoryRouteSearchParams,
): CategorySlugContext | null {
    const parentSlug = routeParams?.parentSlug?.trim();
    if (parentSlug) {
        return resolveTertiaryUnderParent(slugs, routeSlug, parentSlug, routeParams?.parentTagType);
    }

    const primaryMatch = slugs.find((item) => item.slug === routeSlug);
    if (primaryMatch) {
        return {
            primaryItem: primaryMatch,
            activeItem: primaryMatch,
            depth: 1,
        };
    }

    for (const primary of slugs) {
        const secondary = primary.sub_slug?.find((item) => item.slug === routeSlug);
        if (secondary) {
            return {
                primaryItem: primary,
                secondaryItem: secondary,
                activeItem: secondary,
                depth: 2,
            };
        }
    }

    for (const primary of slugs) {
        for (const secondary of primary.sub_slug ?? []) {
            const tertiary = secondary.sub_slug?.find((item) => item.slug === routeSlug);
            if (tertiary) {
                return {
                    primaryItem: primary,
                    secondaryItem: secondary,
                    activeItem: tertiary,
                    depth: 3,
                };
            }
        }
    }

    return null;
}
