'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { PredictionCategoryHorizontalScroll } from '@/components/Prediction/Category/PredictionCategoryHorizontalScroll.js';
import { PredictionCategoryVerticalDivider } from '@/components/Prediction/Category/PredictionCategoryVerticalDivider.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import { partitionPrimaryCategorySlugs } from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    slugs: PolymarketEventSlugListData[];
    context: CategorySlugContext;
}

function PrimaryTab({ item, isActive }: { item: PolymarketEventSlugListData; isActive: boolean }) {
    return (
        <Link
            href={buildPredictionCategoryHref(item)}
            className={classNames(
                'flex h-12 shrink-0 items-center border-b-4 text-base font-bold transition-colors',
                isActive ? 'border-highlight text-highlight' : 'text-third hover:text-main border-transparent',
            )}
        >
            {item.label}
        </Link>
    );
}

export const PredictionCategoryPrimaryTabs = memo<Props>(function PredictionCategoryPrimaryTabs({ slugs, context }) {
    const { leading, main } = useMemo(() => partitionPrimaryCategorySlugs(slugs), [slugs]);
    const showDivider = leading.length > 0 && main.length > 0;

    return (
        <PredictionCategoryHorizontalScroll className="no-scrollbar border-line flex w-full items-center gap-5 overflow-x-auto border-b px-4">
            {leading.map((item) => (
                <PrimaryTab key={item.slug} item={item} isActive={context.primaryItem.slug === item.slug} />
            ))}
            {showDivider ? <PredictionCategoryVerticalDivider /> : null}
            {main.map((item) => (
                <PrimaryTab key={item.slug} item={item} isActive={context.primaryItem.slug === item.slug} />
            ))}
        </PredictionCategoryHorizontalScroll>
    );
});
