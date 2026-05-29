'use client';

import ArrowLeftIcon from '@dimensiondev/assets/arrow-left.svg';
import ArrowRightIcon from '@dimensiondev/assets/arrow-right.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { memo, type PropsWithChildren, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { PREDICTION_CATEGORY_SCROLL_KEY_ATTR } from '@/helpers/prediction/category/getCategoryScrollKey.js';
import { getNextHorizontalScrollLeft } from '@/helpers/prediction/category/getNextHorizontalScrollLeft.js';
import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';

enum ScrollDirection {
    Left = 'left',
    Right = 'right',
}

const SCROLL_CENTER_MAX_ATTEMPTS = 4;

function getScrollLeftToCenter(container: HTMLElement, active: HTMLElement): number {
    const targetLeft = active.offsetLeft - (container.clientWidth - active.clientWidth) / 2;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    return Math.max(0, Math.min(targetLeft, maxScroll));
}

function scrollActiveItemIntoCenter(container: HTMLElement, scrollActiveKey: string): boolean {
    const selector = `[${PREDICTION_CATEGORY_SCROLL_KEY_ATTR}="${CSS.escape(scrollActiveKey)}"]`;
    const active = container.querySelector<HTMLElement>(selector);
    if (!active) return false;

    const targetLeft = getScrollLeftToCenter(container, active);
    if (Math.abs(container.scrollLeft - targetLeft) <= 1) return true;

    container.scrollTo({ left: targetLeft, behavior: 'instant' });
    return true;
}

interface Props extends PropsWithChildren {
    className?: string;
    /** When set, the matching child (`data-prediction-category-scroll-key`) scrolls to the horizontal center. */
    scrollActiveKey?: string | null;
}

export const PredictionCategoryHorizontalScroll = memo<Props>(function PredictionCategoryHorizontalScroll({
    children,
    className,
    scrollActiveKey,
}) {
    const [hiddenLeft, setHiddenLeft] = useState(true);
    const [hiddenRight, setHiddenRight] = useState(true);

    const handleButtons = useCallback((target: HTMLElement) => {
        if (target.scrollWidth <= target.clientWidth) {
            setHiddenLeft(true);
            setHiddenRight(true);
            return;
        }
        setHiddenLeft(target.scrollLeft <= 0);
        setHiddenRight(Math.round(target.scrollLeft) >= Math.trunc(target.scrollWidth - target.clientWidth));
    }, []);

    const throttledHandleButtons = useThrottledCallback(handleButtons);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(() => handleButtons(element));
        resizeObserver.observe(element);
        handleButtons(element);
        return () => resizeObserver.disconnect();
    }, [handleButtons]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;
        handleButtons(element);
    }, [children, handleButtons]);

    useLayoutEffect(() => {
        if (!scrollActiveKey) return;

        const container = scrollRef.current;
        if (!container) return;

        let cancelled = false;
        let attempts = 0;

        const centerActiveItem = () => {
            if (cancelled || attempts >= SCROLL_CENTER_MAX_ATTEMPTS) return;

            attempts += 1;
            if (scrollActiveItemIntoCenter(container, scrollActiveKey)) {
                handleButtons(container);
                return;
            }

            requestAnimationFrame(centerActiveItem);
        };

        centerActiveItem();

        return () => {
            cancelled = true;
        };
    }, [scrollActiveKey, handleButtons]);

    const onScrollTo = useCallback((direction: ScrollDirection) => {
        const element = scrollRef.current;
        if (!element) return;

        const nextLeft = getNextHorizontalScrollLeft(
            {
                scrollLeft: element.scrollLeft,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
            },
            direction === ScrollDirection.Left ? 'left' : 'right',
        );

        element.scrollTo({
            behavior: 'smooth',
            left: nextLeft,
        });
    }, []);

    return (
        <div className="relative w-full">
            <button
                type="button"
                className={classNames(
                    'absolute left-0 z-10 flex h-full transform-gpu cursor-pointer items-center pl-4 duration-100 hover:text-highlight',
                    hiddenLeft ? 'pointer-events-none opacity-0' : '',
                )}
                aria-label={t`Scroll categories left`}
                onClick={() => onScrollTo(ScrollDirection.Left)}
            >
                <span className="absolute left-0 top-0 h-full w-14 bg-gradient-to-l from-transparent to-primaryBottom to-55%" />
                <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                    <ArrowLeftIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <button
                type="button"
                className={classNames(
                    'absolute right-0 z-10 flex h-full transform-gpu cursor-pointer items-center pr-4 duration-100 hover:text-highlight',
                    hiddenRight ? 'pointer-events-none opacity-0' : '',
                )}
                aria-label={t`Scroll categories right`}
                onClick={() => onScrollTo(ScrollDirection.Right)}
            >
                <span className="absolute right-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-primaryBottom to-55%" />
                <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                    <ArrowRightIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <div
                ref={scrollRef}
                className={className}
                onScroll={(event) => throttledHandleButtons(event.currentTarget)}
            >
                {children}
            </div>
        </div>
    );
});
