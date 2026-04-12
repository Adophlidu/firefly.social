import type { UseSuspenseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import type { Components, VirtuosoHandle } from 'react-virtuoso';

import { NoResultsFallback, type NoResultsFallbackProps } from '@/components/NoResultsFallback.js';
import { VirtualList, type VirtualListProps } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { cn } from '@/lib/utils.js';

export interface ListInPageProps<T = unknown, C = unknown> {
    queryResult: UseSuspenseInfiniteQueryResult<T[]>;
    noResultsFallbackRequired?: boolean;
    VirtualListProps?: Omit<VirtualListProps<T, C>, 'context'> & {
        context?: Omit<C, 'hasNextPage' | 'fetchNextPage' | 'isFetching' | 'itemsRendered' | 'footerText'>;
    };
    NoResultsFallbackProps?: NoResultsFallbackProps;
    className?: string;
}

export function ListInPage<T = unknown, C = unknown>({
    queryResult,
    noResultsFallbackRequired = true,
    VirtualListProps,
    NoResultsFallbackProps,
    className,
}: ListInPageProps<T, C>) {
    const itemsRendered = useRef(false);
    const { height: windowHeight } = useWindowSize();
    const [isScrollable, setIsScrollable] = useState(false);
    const pendingIsScrollable = useRef<boolean | null>(null);
    const rafId = useRef<number | null>(null);

    const virtuoso = useRef<VirtuosoHandle>(null);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } = queryResult;
    const showNoResults = noResultsFallbackRequired && !data.length;

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    // force type casting to avoid type error
    const List = VirtualList<T, C>;
    const Components = {
        Footer: VirtualListFooter,
        ...(VirtualListProps?.components ?? {}),
    } as Components<T, C>;

    const userTotalListHeightChanged = VirtualListProps?.totalListHeightChanged;
    const totalListHeightChanged = useCallback(
        (listHeight: number) => {
            // When using window scroll, "scrollable" means the list content is taller than the viewport.
            // This is used by the footer to avoid aggressive auto-fetch loops during normal scrolling.
            pendingIsScrollable.current = listHeight > windowHeight + 1;
            if (rafId.current === null && typeof window !== 'undefined') {
                rafId.current = window.requestAnimationFrame(() => {
                    rafId.current = null;
                    if (pendingIsScrollable.current !== null) {
                        setIsScrollable(pendingIsScrollable.current);
                    }
                });
            }
            userTotalListHeightChanged?.(listHeight);
        },
        [userTotalListHeightChanged, windowHeight],
    );

    useEffect(() => {
        return () => {
            if (rafId.current !== null && typeof window !== 'undefined') {
                window.cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        };
    }, []);

    const Context = {
        hasNextPage,
        fetchNextPage,
        isFetching,
        itemsRendered: itemsRendered.current,
        isScrollable,
        ...(VirtualListProps?.context ?? {}),
    };

    // NOTE: Keep this return **after** all hooks above to avoid "Rendered fewer hooks than expected"
    // when the list transitions from non-empty -> empty.
    if (showNoResults) return <NoResultsFallback {...NoResultsFallbackProps} />;

    return (
        <List
            useWindowScroll
            data={data}
            endReached={onEndReached}
            itemSize={(el: HTMLElement) => {
                if (!itemsRendered.current) itemsRendered.current = true;
                return el.getBoundingClientRect().height;
            }}
            totalListHeightChanged={totalListHeightChanged}
            {...(VirtualListProps as VirtualListProps<T, C>)}
            key={VirtualListProps?.listKey}
            context={Context as C}
            components={Components}
            className={cn('max-md:no-scrollbar w-full min-w-0', className)}
            virtuosoRef={virtuoso}
        />
    );
}
