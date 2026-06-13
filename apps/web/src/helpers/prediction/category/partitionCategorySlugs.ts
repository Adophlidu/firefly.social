import { FIFA_SLUG } from '@/constants/bets.js';
import { LEADING_PRIMARY_SLUGS, LEADING_SECONDARY_SLUGS } from '@/helpers/prediction/category/constants.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export interface PartitionedCategorySlugs {
    leading: PolymarketEventSlugListData[];
    main: PolymarketEventSlugListData[];
}

function partitionByLeadingSlugs(
    slugs: PolymarketEventSlugListData[],
    leadingSlugs: readonly string[],
): PartitionedCategorySlugs {
    const leadingSet = new Set<string>(leadingSlugs);
    const bySlug = new Map(slugs.map((item) => [item.slug, item]));
    const leading: PolymarketEventSlugListData[] = [];

    for (const slug of leadingSlugs) {
        const item = bySlug.get(slug);
        if (item) {
            leading.push(item);
        }
    }

    const main = slugs.filter((item) => !leadingSet.has(item.slug));
    return { leading, main };
}

export function partitionPrimaryCategorySlugs(slugs: PolymarketEventSlugListData[]): PartitionedCategorySlugs {
    const result = partitionByLeadingSlugs(slugs, LEADING_PRIMARY_SLUGS);
    const fifaSlug = slugs.find((x) => x.slug === 'sports')?.sub_slug?.find((x) => x.slug === FIFA_SLUG);
    if (fifaSlug) {
        result.leading.splice(1, 0, {
            ...fifaSlug,
            label: 'FIFA',
        });
    }

    return result;
}

export function partitionSecondaryCategorySlugs(slugs: PolymarketEventSlugListData[]): PartitionedCategorySlugs {
    return partitionByLeadingSlugs(slugs, LEADING_SECONDARY_SLUGS);
}
