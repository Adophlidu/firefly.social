import ArrowLeftIcon from '@dimensiondev/assets/arrow-left.svg';
import ArrowRightIcon from '@dimensiondev/assets/arrow-right.svg';
import { classNames } from '@dimensiondev/utils';
import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';

import { PROFILE_SOURCE_TABS_CONTAINER_ID, ScrollDirection } from '@/components/Profile/ProfileSourceTabs/constants.js';
import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';

export function ProfileSourceTabsContainer({ children }: PropsWithChildren) {
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

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(() => handleButtons(element));
        resizeObserver.observe(element);
        handleButtons(element);
        return () => resizeObserver.disconnect();
    }, [handleButtons]);

    function onScrollTo(direction: ScrollDirection) {
        const element = ref.current;
        if (!element) return;
        element.scrollTo({
            behavior: 'smooth',
            left: direction === ScrollDirection.Left ? 0 : element.scrollWidth,
        });
    }

    return (
        <div className="align-center relative w-full px-4">
            <button
                className={classNames(
                    'hover:text-highlight absolute left-0 z-10 flex h-full transform-gpu cursor-pointer items-center pl-4 duration-100',
                    {
                        'pointer-events-none opacity-0': hiddenLeft,
                    },
                )}
                onClick={() => onScrollTo(ScrollDirection.Left)}
            >
                <span className="to-primaryBottom absolute left-0 top-0 h-full w-14 bg-gradient-to-l from-transparent to-55%" />
                <span className="shadow-action border-line bg-primaryBottom relative flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <ArrowLeftIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <button
                className={classNames(
                    'hover:text-highlight absolute right-0 z-10 flex h-full transform-gpu cursor-pointer items-center pr-4 duration-100',
                    {
                        'pointer-events-none opacity-0': hiddenRight,
                    },
                )}
                onClick={() => onScrollTo(ScrollDirection.Right)}
            >
                <span className="to-primaryBottom absolute right-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-55%" />
                <span className="shadow-action border-line bg-primaryBottom relative flex size-5 shrink-0 items-center justify-center rounded-full border">
                    <ArrowRightIcon className="relative h-2 w-auto shrink-0" />
                </span>
            </button>
            <div
                className="no-scrollbar align-center relative flex w-full overflow-auto pb-2.5 pt-2"
                ref={ref}
                onScroll={(e) => throttledHandleButtons(e.currentTarget)}
                id={PROFILE_SOURCE_TABS_CONTAINER_ID}
            >
                {children}
            </div>
        </div>
    );
}
