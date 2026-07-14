'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import { CRYPTO_QUICK_BUY_PERIODS } from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import { useLocale } from '@/hooks/useLocale.js';
import { capturePolymarketHomeCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
}

/**
 * The 5-period Quick Buy switcher, styled like the FIFA `PredictionCategoryTabs` pill and placed
 * on the right of the header title. Full labels on desktop, compact (`5m/15m/1hr/4hrs/Daily`) on
 * mobile via a responsive swap. The active period (depth 3) is highlighted.
 */
export const PredictionCategoryCryptoPeriodSwitcher = memo<Props>(function PredictionCategoryCryptoPeriodSwitcher({
    context,
}) {
    const locale = useLocale();
    const primary = context.primaryItem;
    const quickBuy = context.secondaryItem;
    if (!quickBuy) return null;

    const activePeriodSlug = context.depth === 3 ? context.activeItem.slug : null;

    return (
        <div className="flex h-9 shrink-0 rounded-lg bg-bg p-0.5">
            {CRYPTO_QUICK_BUY_PERIODS.map((period) => {
                const periodItem: PolymarketEventSlugListData = {
                    slug: period.slug,
                    label: period.label,
                    sub_slug: [],
                };
                const isActive = activePeriodSlug === period.slug;
                return (
                    <Link
                        replace
                        key={period.slug}
                        href={buildPredictionCategoryHref(periodItem, [primary, quickBuy])}
                        onClick={() => capturePolymarketHomeCategoryClick(period.slug, period.label, 3)}
                        className={classNames(
                            'flex h-full flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-bold transition-colors',
                            isActive ? 'bg-primaryBottom text-main shadow-sm' : 'text-second',
                        )}
                    >
                        <span className="max-md:hidden">{resolvePredictionCategoryLabel(locale, period.label)}</span>
                        <span className="md:hidden">{period.mobileLabel}</span>
                    </Link>
                );
            })}
        </div>
    );
});
