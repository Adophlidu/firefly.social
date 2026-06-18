'use client';

import ArrowLeftIcon from '@dimensiondev/assets/arrow-left.svg';
import ArrowRightIcon from '@dimensiondev/assets/arrow-right.svg';
import { classNames } from '@dimensiondev/utils';
import {
    createContext,
    type HTMLProps,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { getNextHorizontalScrollLeft } from '@/helpers/prediction/category/getNextHorizontalScrollLeft.js';
import { useThrottledCallback } from '@/hooks/useThrottledCallback.js';

type Variant = 'default' | 'second' | 'solid' | 'subtle' | 'main';

export interface TabsProps<T = string>
    extends PropsWithChildren, Omit<HTMLProps<HTMLDivElement>, 'onChange' | 'value'> {
    value: T;
    onChange: (value: T) => void;
    variant?: Variant;
}

interface TabContextProps {
    value: string;
    onChange: (value: string) => void;
    variant: Variant;
}

const TabContext = createContext<TabContextProps>({
    value: '',
    onChange: (tab: string) => {
        throw new Error('The `TabContext` is error');
    },
    variant: 'default',
});

export function Tabs<T = string>(props: TabsProps<T>) {
    const { value, onChange, children, variant = 'default' } = props;
    const [hiddenLeft, setHiddenLeft] = useState(true);
    const [hiddenRight, setHiddenRight] = useState(true);
    const navRef = useRef<HTMLElement>(null);

    const updateArrows = useCallback((target: HTMLElement) => {
        if (target.scrollWidth <= target.clientWidth) {
            setHiddenLeft(true);
            setHiddenRight(true);
            return;
        }
        setHiddenLeft(target.scrollLeft <= 0);
        setHiddenRight(Math.round(target.scrollLeft) >= Math.trunc(target.scrollWidth - target.clientWidth));
    }, []);

    const throttledUpdateArrows = useThrottledCallback(updateArrows);

    useEffect(() => {
        const element = navRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(() => updateArrows(element));
        resizeObserver.observe(element);
        updateArrows(element);
        return () => resizeObserver.disconnect();
    }, [updateArrows]);

    useEffect(() => {
        const element = navRef.current;
        if (!element) return;
        updateArrows(element);
    }, [children, updateArrows]);

    const onScrollTo = useCallback((direction: 'left' | 'right') => {
        const element = navRef.current;
        if (!element) return;
        const nextLeft = getNextHorizontalScrollLeft(
            {
                scrollLeft: element.scrollLeft,
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
            },
            direction,
        );
        element.scrollTo({ behavior: 'smooth', left: nextLeft });
    }, []);

    // Scroll the active tab to center when value changes
    useLayoutEffect(() => {
        const container = navRef.current;
        if (!container) return;

        let cancelled = false;
        let attempts = 0;

        const centerActiveTab = () => {
            if (cancelled || attempts >= 4) return;
            attempts += 1;

            const activeTab = container.querySelector<HTMLElement>('[aria-current="page"]');
            if (!activeTab) {
                requestAnimationFrame(centerActiveTab);
                return;
            }

            const targetLeft = activeTab.offsetLeft - (container.clientWidth - activeTab.clientWidth) / 2;
            const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
            const clampedLeft = Math.max(0, Math.min(targetLeft, maxScroll));

            if (Math.abs(container.scrollLeft - clampedLeft) > 1) {
                container.scrollTo({ left: clampedLeft, behavior: 'smooth' });
            }
        };

        centerActiveTab();

        return () => {
            cancelled = true;
        };
    }, [value]);

    const contextValue = useMemo(() => {
        return {
            onChange,
            value: value as string,
            variant,
        } as TabContextProps;
    }, [onChange, value, variant]);
    const variantClassName = (
        {
            default: 'space-x-4',
            second: 'space-x-0',
            solid: 'space-x-0 border border-secondaryLine py-1 px-[5px] rounded-[6px] min-w-0',
            subtle: 'space-x-2 py-1.6',
            main: 'border-b border-b-line space-x-6',
        } satisfies Record<Variant, string>
    )[variant];

    return (
        <TabContext.Provider value={contextValue}>
            <div className="relative">
                <button
                    type="button"
                    className={classNames(
                        'absolute left-0 z-10 flex h-full transform-gpu cursor-pointer items-center pl-4 duration-100 hover:text-highlight',
                        hiddenLeft ? 'pointer-events-none opacity-0' : '',
                    )}
                    aria-label="Scroll tabs left"
                    onClick={() => onScrollTo('left')}
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
                    aria-label="Scroll tabs right"
                    onClick={() => onScrollTo('right')}
                >
                    <span className="absolute right-0 top-0 h-full w-14 bg-gradient-to-r from-transparent to-primaryBottom to-55%" />
                    <span className="shadow-action relative flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-primaryBottom">
                        <ArrowRightIcon className="relative h-2 w-auto shrink-0" />
                    </span>
                </button>
                <nav
                    className={classNames('no-scrollbar flex overflow-x-auto', variantClassName, props.className)}
                    aria-label="Tabs"
                    ref={navRef}
                    onScroll={(event) => throttledUpdateArrows(event.currentTarget)}
                >
                    {children}
                </nav>
            </div>
        </TabContext.Provider>
    );
}

interface TabProps extends HTMLProps<HTMLLIElement> {
    value: string;
    disabled?: boolean;
}

export function Tab({ children, value, className, disabled, ...props }: TabProps) {
    const { value: currentTab, onChange, variant } = useContext(TabContext);
    const liVariantClassName = (
        {
            default: 'flex-1 text-sm sm:text-xl',
            second: 'flex-1 text-sm sm:text-base',
            solid: 'text-sm leading-5 font-medium',
            subtle: 'text-sm font-semibold cursor-pointer',
            main: '',
        } satisfies Record<Variant, string>
    )[variant];
    const variantClassName = (
        {
            default: classNames(
                'h-[43px] border-b-2 px-4 text-center font-bold leading-[43px] hover:cursor-pointer hover:text-main md:h-[60px] md:py-[18px] md:leading-6',
                currentTab === value ? 'border-farcasterPrimary text-main' : 'border-transparent text-third',
            ),
            second: classNames(
                'border-b-2 text-center font-bold hover:cursor-pointer hover:text-main sm:p-4 sm:pb-3 sm:leading-5',
                currentTab === value ? 'border-farcasterPrimary text-main' : 'border-transparent text-third',
            ),
            solid: classNames(
                'h-8 rounded-[4px] px-[12px] py-[6px] transition-colors hover:text-highlight',
                currentTab === value ? 'bg-bg text-highlight' : 'cursor-pointer text-second',
            ),
            subtle: classNames(
                'h-8 rounded-full border px-4 leading-8 text-main duration-100',
                currentTab === value ? 'border-secondaryLine bg-bg' : 'border-transparent text-third',
            ),
            main: classNames(
                'h-12 cursor-pointer border-b-4 text-base font-bold !leading-[48px] duration-100 hover:text-highlight',
                currentTab === value ? 'border-highlight text-highlight' : 'border-transparent text-third',
            ),
        } satisfies Record<Variant, string>
    )[variant];

    return (
        <li
            className={classNames(
                'flex list-none justify-center lg:flex-initial lg:justify-start',
                {
                    'opacity-40': !!disabled,
                },
                liVariantClassName,
                className,
            )}
            {...props}
        >
            <a
                className={classNames(variantClassName, 'whitespace-nowrap')}
                aria-current={currentTab === value ? 'page' : undefined}
                onClick={() => {
                    if (disabled) return;
                    onChange?.(value);
                }}
            >
                {children}
            </a>
        </li>
    );
}
