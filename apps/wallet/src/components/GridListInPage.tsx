import { EMPTY_OBJECT } from '@dimensiondev/constants';
import { type UseSuspenseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { type GridComponents } from 'react-virtuoso';

import { NoResultsFallback, type NoResultsFallbackProps } from '@/components/NoResultsFallback.js';
import { VirtualGridList, type VirtualGridListProps } from '@/components/VirtualList/VirtualGridList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { cn } from '@/lib/utils.js';

export interface GridListInPageProps<T = unknown, C = unknown> {
    queryResult: UseSuspenseInfiniteQueryResult<T[]>;
    VirtualGridListProps?: Omit<VirtualGridListProps<T, C>, 'context'> & {
        context?: Omit<C, 'hasNextPage' | 'fetchNextPage' | 'isFetching' | 'itemsRendered'>;
    };
    className?: string;
    hiddenFooter?: boolean;
    noResultsFallbackRequired?: boolean;
    NoResultsFallbackProps?: NoResultsFallbackProps;
}

export function GridListInPage<T = unknown, C = unknown>({
    queryResult,
    VirtualGridListProps,
    hiddenFooter = false,
    className,
    noResultsFallbackRequired = true,
    NoResultsFallbackProps,
}: GridListInPageProps<T, C>) {
    const itemsRendered = useRef(true);
    const { height: windowHeight } = useWindowSize();
    const [isScrollable, setIsScrollable] = useState(false);
    const containerEl = useRef<HTMLDivElement | null>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const pendingIsScrollable = useRef<boolean | null>(null);
    const rafId = useRef<number | null>(null);
    const windowHeightRef = useRef(windowHeight);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } = queryResult;

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    const scheduleSetScrollable = useCallback(() => {
        if (rafId.current !== null || typeof window === 'undefined') return;
        rafId.current = window.requestAnimationFrame(() => {
            rafId.current = null;
            if (pendingIsScrollable.current !== null) {
                setIsScrollable(pendingIsScrollable.current);
            }
        });
    }, []);

    const containerRef = useCallback(
        (node: HTMLDivElement | null) => {
            containerEl.current = node;
            resizeObserver.current?.disconnect();
            resizeObserver.current = null;
            if (!node) return;

            resizeObserver.current = new ResizeObserver(() => {
                const h = node.getBoundingClientRect().height;
                pendingIsScrollable.current = h > windowHeightRef.current + 1;
                scheduleSetScrollable();
            });
            resizeObserver.current.observe(node);
        },
        [scheduleSetScrollable],
    );

    useEffect(() => {
        return () => {
            resizeObserver.current?.disconnect();
            if (rafId.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        };
    }, []);

    useEffect(() => {
        windowHeightRef.current = windowHeight;
        if (containerEl.current) {
            const h = containerEl.current.getBoundingClientRect().height;
            pendingIsScrollable.current = h > windowHeight + 1;
            scheduleSetScrollable();
        }
    }, [scheduleSetScrollable, windowHeight]);

    const Context = {
        hasNextPage,
        fetchNextPage,
        isFetching,
        itemsRendered: itemsRendered.current,
        isScrollable,
        ...VirtualGridListProps?.context,
    };
    // force type casting to avoid type error
    const List = VirtualGridList<T, C>;
    const Components = (VirtualGridListProps?.components ?? EMPTY_OBJECT) as GridComponents<C>;

    if (noResultsFallbackRequired && !data.length) {
        return <NoResultsFallback {...NoResultsFallbackProps} />;
    }

    return (
        <div className={className} ref={containerRef}>
            <List
                useWindowScroll
                data={data}
                endReached={onEndReached}
                {...VirtualGridListProps}
                context={Context as C}
                components={Components}
                className={cn('max-md:no-scrollbar', VirtualGridListProps?.className)}
            />
            {hiddenFooter ? null : <VirtualListFooter context={Context} />}
        </div>
    );
}
