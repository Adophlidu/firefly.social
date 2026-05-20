import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export type CategorySlugDepth = 1 | 2 | 3;

export interface CategorySlugContext {
    primaryItem: PolymarketEventSlugListData;
    secondaryItem?: PolymarketEventSlugListData;
    activeItem: PolymarketEventSlugListData;
    depth: CategorySlugDepth;
}

export function resolveCategorySlugContext(
    slugs: PolymarketEventSlugListData[],
    routeSlug: string,
): CategorySlugContext | null {
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
