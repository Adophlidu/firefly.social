import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export type CategorySlugDepth = 1 | 2 | 3;

export interface CategorySlugContext {
    primaryItem: PolymarketEventSlugListData;
    secondaryItem?: PolymarketEventSlugListData;
    activeItem: PolymarketEventSlugListData;
    depth: CategorySlugDepth;
}

/**
 * Resolve a category URL — whose path mirrors the slug tree — into a {@link CategorySlugContext}.
 *
 * `segments[0]` is the primary, `[1]` a secondary, `[2]` a tertiary, so every slug that recurses
 * at different depths (`live` under both Sports & Esports; `esports` as a primary vs. the dead
 * Sports sub-node; `fifwc` top-level vs. nested) is disambiguated purely by its position in the
 * path. Deeper segments are ignored (depth is capped at 3).
 */
export function resolveCategorySlugContext(
    slugs: PolymarketEventSlugListData[],
    segments: string[],
): CategorySlugContext | null {
    if (!segments.length) return null;

    const primary = slugs.find((item) => item.slug === segments[0]);
    if (primary) {
        if (segments.length === 1) {
            return { primaryItem: primary, activeItem: primary, depth: 1 };
        }

        const secondary = primary.sub_slug?.find((item) => item.slug === segments[1]);
        if (secondary) {
            if (segments.length === 2) {
                return { primaryItem: primary, secondaryItem: secondary, activeItem: secondary, depth: 2 };
            }

            const tertiary = secondary.sub_slug?.find((item) => item.slug === segments[2]);
            if (tertiary) {
                return { primaryItem: primary, secondaryItem: secondary, activeItem: tertiary, depth: 3 };
            }
        }
    }

    // Single-segment deep links from outside the category nav carry only a leaf slug with no
    // ancestry in the URL (e.g. the sports recommendation "More" link targets a league like `nba`
    // or the shared `live`). Resolve such unique leaves anywhere in the tree; collisions fall back
    // to the first match, matching the prior flat-route behaviour.
    if (segments.length === 1) {
        return resolveLeafAnywhere(slugs, segments[0]);
    }

    return null;
}

/** Locate a single slug as a secondary or tertiary anywhere in the tree (legacy leaf fallback). */
function resolveLeafAnywhere(slugs: PolymarketEventSlugListData[], slug: string): CategorySlugContext | null {
    for (const primary of slugs) {
        const secondary = primary.sub_slug?.find((item) => item.slug === slug);
        if (secondary) {
            return { primaryItem: primary, secondaryItem: secondary, activeItem: secondary, depth: 2 };
        }
    }

    for (const primary of slugs) {
        for (const secondary of primary.sub_slug ?? []) {
            const tertiary = secondary.sub_slug?.find((item) => item.slug === slug);
            if (tertiary) {
                return { primaryItem: primary, secondaryItem: secondary, activeItem: tertiary, depth: 3 };
            }
        }
    }

    return null;
}
