'use client';

import LightningIcon from '@dimensiondev/assets/lightning-sharp.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { memo, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { PredictionCategoryHorizontalScroll } from '@/components/Prediction/Category/PredictionCategoryHorizontalScroll.js';
import { secondaryChipClassName } from '@/components/Prediction/Category/PredictionCategorySecondaryChip.js';
import { PredictionCategoryVerticalDivider } from '@/components/Prediction/Category/PredictionCategoryVerticalDivider.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import { CRYPTO_QUICK_BUY_SLUG } from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import {
    getSecondaryCategoryScrollKey,
    PREDICTION_CATEGORY_SCROLL_KEY_ATTR,
} from '@/helpers/prediction/category/getCategoryScrollKey.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import { useLocale } from '@/hooks/useLocale.js';
import { capturePolymarketHomeCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
}

function isSecondaryChipActive(context: CategorySlugContext, slug: string): boolean {
    if (context.depth === 2) return context.activeItem.slug === slug;
    // Under Quick Buy a period (depth 3) is active — highlight the Quick Buy secondary, not a period.
    if (context.depth === 3) return context.secondaryItem?.slug === slug;
    return false;
}

/**
 * Crypto-only secondary nav: Quick Buy chip (lightning icon, leading/pinned before the divider) +
 * the 9 topic category chips. Quick Buy renders as a plain chip even though it carries period
 * children — the periods surface in the separate `PredictionCategoryCryptoPeriodSwitcher`.
 */
export const PredictionCategoryCryptoSecondaryNav = memo<Props>(function PredictionCategoryCryptoSecondaryNav({
    context,
}) {
    const locale = useLocale();
    const items = context.primaryItem.sub_slug ?? EMPTY_LIST;
    const { quickBuy, others } = useMemo(() => {
        const quickBuy = items.find((item) => item.slug === CRYPTO_QUICK_BUY_SLUG);
        const others = items.filter((item) => item.slug !== CRYPTO_QUICK_BUY_SLUG);
        return { quickBuy, others };
    }, [items]);

    const scrollActiveKey = getSecondaryCategoryScrollKey(context);
    const primary = context.primaryItem;

    if (!quickBuy) return null;

    return (
        <PredictionCategoryHorizontalScroll
            scrollActiveKey={scrollActiveKey}
            className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4"
        >
            <Link
                replace
                href={buildPredictionCategoryHref(quickBuy, [primary])}
                onClick={() => capturePolymarketHomeCategoryClick(quickBuy.slug, quickBuy.label, 2)}
                {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: quickBuy.slug }}
                className={secondaryChipClassName(isSecondaryChipActive(context, quickBuy.slug))}
            >
                <LightningIcon width={18} height={18} className="shrink-0" />
                <span className="whitespace-nowrap">{resolvePredictionCategoryLabel(locale, quickBuy.label)}</span>
            </Link>
            <PredictionCategoryVerticalDivider />
            {others.map((item: PolymarketEventSlugListData) => (
                <Link
                    replace
                    key={item.slug}
                    href={buildPredictionCategoryHref(item, [primary])}
                    onClick={() => capturePolymarketHomeCategoryClick(item.slug, item.label, 2)}
                    {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: item.slug }}
                    className={secondaryChipClassName(isSecondaryChipActive(context, item.slug))}
                >
                    <span className="whitespace-nowrap">{resolvePredictionCategoryLabel(locale, item.label)}</span>
                </Link>
            ))}
        </PredictionCategoryHorizontalScroll>
    );
});
