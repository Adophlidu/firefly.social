'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { useLingui } from '@lingui/react';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { PredictionCategoryHorizontalScroll } from '@/components/Prediction/Category/PredictionCategoryHorizontalScroll.js';
import { secondaryChipClassName } from '@/components/Prediction/Category/PredictionCategorySecondaryChip.js';
import { PredictionCategorySlugIcon } from '@/components/Prediction/Category/PredictionCategorySlugIcon.js';
import { PredictionCategoryTertiaryDropdown } from '@/components/Prediction/Category/PredictionCategoryTertiaryDropdown.js';
import { PredictionCategoryVerticalDivider } from '@/components/Prediction/Category/PredictionCategoryVerticalDivider.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import {
    getSecondaryCategoryScrollKey,
    PREDICTION_CATEGORY_SCROLL_KEY_ATTR,
} from '@/helpers/prediction/category/getCategoryScrollKey.js';
import { partitionSecondaryCategorySlugs } from '@/helpers/prediction/category/partitionCategorySlugs.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { hasTertiaryCategories } from '@/helpers/prediction/category/resolveCategorySlugIcon.js';
import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import { capturePolymarketHomeCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
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

function SecondaryChipLink({ item, isActive }: { item: PolymarketEventSlugListData; isActive: boolean }) {
    const {
        i18n: { locale },
    } = useLingui();
    return (
        <Link
            replace
            href={buildPredictionCategoryHref(item)}
            onClick={() => capturePolymarketHomeCategoryClick(item.slug, item.label, 2)}
            {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: item.slug }}
            className={secondaryChipClassName(isActive)}
        >
            <PredictionCategorySlugIcon item={item} />
            <span className="whitespace-nowrap">{resolvePredictionCategoryLabel(locale, item.label)}</span>
        </Link>
    );
}

function renderSecondaryItem(item: PolymarketEventSlugListData, context: CategorySlugContext) {
    if (hasTertiaryCategories(item)) {
        return <PredictionCategoryTertiaryDropdown key={item.slug} item={item} context={context} />;
    }

    return <SecondaryChipLink key={item.slug} item={item} isActive={isSecondaryChipActive(context, item.slug)} />;
}

export const PredictionCategorySecondaryNav = memo<Props>(function PredictionCategorySecondaryNav({ context }) {
    const allItems = useMemo(() => context.primaryItem.sub_slug ?? EMPTY_LIST, [context.primaryItem.sub_slug]);
    const { leading, main } = useMemo(() => partitionSecondaryCategorySlugs(allItems), [allItems]);

    if (!allItems.length) return null;

    const showDivider = leading.length > 0 && main.length > 0;
    const scrollActiveKey = getSecondaryCategoryScrollKey(context);

    return (
        <PredictionCategoryHorizontalScroll
            scrollActiveKey={scrollActiveKey}
            className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4"
        >
            {leading.map((item) => renderSecondaryItem(item, context))}
            {showDivider ? <PredictionCategoryVerticalDivider /> : null}
            {main.map((item) => renderSecondaryItem(item, context))}
        </PredictionCategoryHorizontalScroll>
    );
});
