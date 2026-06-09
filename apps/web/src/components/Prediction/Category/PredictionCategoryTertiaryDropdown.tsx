'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment, memo } from 'react';

import { Link } from '@/components/Link.js';
import { secondaryChipClassName } from '@/components/Prediction/Category/PredictionCategorySecondaryChip.js';
import { PredictionCategorySlugIcon } from '@/components/Prediction/Category/PredictionCategorySlugIcon.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import { PREDICTION_CATEGORY_SCROLL_KEY_ATTR } from '@/helpers/prediction/category/getCategoryScrollKey.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { capturePolymarketHomeCategoryClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    item: PolymarketEventSlugListData;
    context: CategorySlugContext;
}

export const PredictionCategoryTertiaryDropdown = memo<Props>(function PredictionCategoryTertiaryDropdown({
    item,
    context,
}) {
    const tertiaryItems = item.sub_slug ?? [];
    const isSecondaryActive = context.secondaryItem?.slug === item.slug;
    const isOpenBySelection = context.depth === 3 && isSecondaryActive;

    return (
        <Popover as="div" className="relative shrink-0" {...{ [PREDICTION_CATEGORY_SCROLL_KEY_ATTR]: item.slug }}>
            {({ open }) => (
                <>
                    <PopoverButton
                        className={classNames(secondaryChipClassName(isSecondaryActive || open), 'focus:outline-none')}
                    >
                        <PredictionCategorySlugIcon item={item} />
                        <span className="whitespace-nowrap">{item.label}</span>
                        <ArrowDownIcon
                            width={14}
                            height={14}
                            className={classNames('shrink-0 transition-transform', open ? 'rotate-180' : '')}
                        />
                    </PopoverButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-150"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            portal={false}
                            anchor="bottom start"
                            className="z-30 mt-2 min-w-[200px] max-w-[min(320px,90vw)] rounded-2xl border border-line bg-lightBottom p-3 shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            <div className="flex flex-col gap-0.5">
                                {tertiaryItems.map((tertiary) => {
                                    const isActive = isOpenBySelection && context.activeItem.slug === tertiary.slug;
                                    return (
                                        <Link
                                            replace
                                            key={tertiary.slug}
                                            href={buildPredictionCategoryHref(tertiary, item)}
                                            onClick={() =>
                                                capturePolymarketHomeCategoryClick(tertiary.slug, tertiary.label, 3)
                                            }
                                            className={classNames(
                                                'flex items-center gap-2 rounded-xl p-2 text-sm font-medium text-main transition-colors hover:bg-lightBg',
                                                isActive ? 'bg-bg' : '',
                                            )}
                                        >
                                            <PredictionCategorySlugIcon item={tertiary} />
                                            <span className="min-w-0 flex-1 truncate">{tertiary.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});
