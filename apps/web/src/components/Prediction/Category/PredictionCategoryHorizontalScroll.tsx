'use client';

import ArrowLeftIcon from '@dimensiondev/assets/arrow-left.svg';
import ArrowRightIcon from '@dimensiondev/assets/arrow-right.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { memo, type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';

import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';

enum ScrollDirection {
    Left = 'left',
    Right = 'right',
}

interface Props extends PropsWithChildren {
    className?: string;
}

export const PredictionCategoryHorizontalScroll = memo<Props>(function PredictionCategoryHorizontalScroll({
    children,
    className,
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

    const onScrollTo = useCallback((direction: ScrollDirection) => {
        const element = scrollRef.current;
        if (!element) return;
        element.scrollTo({
            behavior: 'smooth',
            left: direction === ScrollDirection.Left ? 0 : element.scrollWidth,
        });
    }, []);

    return (
        <div className="relative w-full">
            <button
                type="button"
                className={classNames(
                    'hover:text-highlight absolute left-0 z-10 flex h-full transform-gpu cursor-pointer items-center pl-4 duration-100',
                    hiddenLeft ? 'pointer-events-none opacity-0' : '',
                )}
                aria-label={t`Scroll categories left`}
                onClick={() => onScrollTo(ScrollDirection.Left)}
            >
                <span className="to-primaryBottom absolute left-0 top-0 h-full w-14 bg-gradient-to-l from-transparent to-55%" />
                <span className="shadow-action border-line bg-primaryBottom relative flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <ArrowLeftIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <button
                type="button"
                className={classNames(
                    'hover:text-highlight absolute right-0 z-10 flex h-full transform-gpu cursor-pointer items-center pr-4 duration-100',
                    hiddenRight ? 'pointer-events-none opacity-0' : '',
                )}
                aria-label={t`Scroll categories right`}
                onClick={() => onScrollTo(ScrollDirection.Right)}
            >
                <span className="to-primaryBottom absolute right-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-55%" />
                <span className="shadow-action border-line bg-primaryBottom relative flex size-5 shrink-0 items-center justify-center rounded-full border">
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
