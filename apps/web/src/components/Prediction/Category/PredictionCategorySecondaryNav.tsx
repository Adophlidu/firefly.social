'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { PredictionCategoryHorizontalScroll } from '@/components/Prediction/Category/PredictionCategoryHorizontalScroll.js';
import { secondaryChipClassName } from '@/components/Prediction/Category/PredictionCategorySecondaryChip.js';
import { PredictionCategorySlugIcon } from '@/components/Prediction/Category/PredictionCategorySlugIcon.js';
import { PredictionCategoryTertiaryDropdown } from '@/components/Prediction/Category/PredictionCategoryTertiaryDropdown.js';
import { PredictionCategoryVerticalDivider } from '@/components/Prediction/Category/PredictionCategoryVerticalDivider.js';
import {
    buildPredictionCategoryHref,
    buildPredictionCategoryHrefForPrimary,
} from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import { ESPORTS_PRIMARY_SLUG, SPORTS_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import {
    getSecondaryCategoryScrollKey,
    PREDICTION_CATEGORY_SCROLL_KEY_ATTR,
} from '@/helpers/prediction/category/getCategoryScrollKey.js';
import { partitionSecondaryCategorySlugs } from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { hasTertiaryCategories } from '@/helpers/prediction/category/resolveCategorySlugIcon.js';
import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import { useLocale } from '@/hooks/useLocale.js';
import { capturePolymarketHomeCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
    /** Full top-level slugs list, used to resolve cross-primary entries (e.g. the Sports → Esports shortcut). */
    slugs?: PolymarketEventSlugListData[];
}

function isSecondaryChipActive(context: CategorySlugContext, slug: string): boolean {
    if (context.depth === 2) {
        return context.activeItem.slug === slug;
    }
    if (context.depth === 3) {
        return context.secondaryItem?.slug === slug;
    }
    return false;
}

function SecondaryChipLink({
    item,
    isActive,
    primary,
}: {
    item: PolymarketEventSlugListData;
    isActive: boolean;
    primary?: PolymarketEventSlugListData;
}) {
    const locale = useLocale();
    return (
        <Link
            replace
            href={buildPredictionCategoryHref(item, primary ? [primary] : [])}
            onClick={() => capturePolymarketHomeCategoryClick(item.slug, item.label, 2)}
            {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: item.slug }}
            className={secondaryChipClassName(isActive)}
        >
            <PredictionCategorySlugIcon item={item} />
            <span className="whitespace-nowrap">{resolvePredictionCategoryLabel(locale, item.label)}</span>
        </Link>
    );
}

/**
 * A chip rendered inside a primary's secondary row that links to a *different* primary tab
 * (e.g. the trailing "Esports" shortcut under Sports). Lands on that primary's default secondary.
 */
function SecondaryPrimaryChipLink({ item }: { item: PolymarketEventSlugListData }) {
    const locale = useLocale();
    return (
        <Link
            replace
            href={buildPredictionCategoryHrefForPrimary(item)}
            onClick={() => capturePolymarketHomeCategoryClick(item.slug, item.label, 1)}
            {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: item.slug }}
            className={secondaryChipClassName(false)}
        >
            <PredictionCategorySlugIcon item={item} />
            <span className="whitespace-nowrap">{resolvePredictionCategoryLabel(locale, item.label)}</span>
        </Link>
    );
}

function renderSecondaryItem(
    item: PolymarketEventSlugListData,
    context: CategorySlugContext,
    primary: CategorySlugContext['primaryItem'],
) {
    if (hasTertiaryCategories(item)) {
        return <PredictionCategoryTertiaryDropdown key={item.slug} item={item} context={context} />;
    }

    return (
        <SecondaryChipLink
            key={item.slug}
            item={item}
            isActive={isSecondaryChipActive(context, item.slug)}
            primary={primary}
        />
    );
}

export const PredictionCategorySecondaryNav = memo<Props>(function PredictionCategorySecondaryNav({ context, slugs }) {
    const isSportsPrimary = context.primaryItem.slug === SPORTS_PRIMARY_SLUG;
    const esportsPrimary = useMemo(() => slugs?.find((item) => item.slug === ESPORTS_PRIMARY_SLUG), [slugs]);
    const allItems = useMemo(() => {
        const items = context.primaryItem.sub_slug ?? EMPTY_LIST;
        // Esports now has its own top-level tab; hide it as a Sports sub-category.
        return isSportsPrimary ? items.filter((item) => item.slug !== ESPORTS_PRIMARY_SLUG) : items;
    }, [context.primaryItem.sub_slug, isSportsPrimary]);
    const { leading, main } = useMemo(() => partitionSecondaryCategorySlugs(allItems), [allItems]);

    if (!allItems.length) return null;

    const primary = context.primaryItem;
    const showDivider = leading.length > 0 && main.length > 0;
    const scrollActiveKey = getSecondaryCategoryScrollKey(context);

    return (
        <PredictionCategoryHorizontalScroll
            scrollActiveKey={scrollActiveKey}
            className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4"
        >
            {leading.map((item) => renderSecondaryItem(item, context, primary))}
            {showDivider ? <PredictionCategoryVerticalDivider /> : null}
            {main.map((item) => renderSecondaryItem(item, context, primary))}
            {isSportsPrimary && esportsPrimary ? (
                <SecondaryPrimaryChipLink key={esportsPrimary.slug} item={esportsPrimary} />
            ) : null}
        </PredictionCategoryHorizontalScroll>
    );
});
