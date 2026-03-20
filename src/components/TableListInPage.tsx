'use client';

import { EMPTY_OBJECT } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { type UseSuspenseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { type TableComponents } from 'react-virtuoso';

import { NoResultsFallback, type NoResultsFallbackProps } from '@/components/NoResultsFallback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { VirtualTableList, type VirtualTableListProps } from '@/components/VirtualList/VirtualTableList.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface TableListInPageProps<T = unknown, C = unknown> {
    queryResult: UseSuspenseInfiniteQueryResult<T[]>;
    loginRequired?: boolean;
    noResultsFallbackRequired?: boolean;
    VirtualTableListProps?: Omit<VirtualTableListProps<T, C>, 'context'> & {
        context?: Omit<C, 'hasNextPage' | 'fetchNextPage' | 'isFetching' | 'itemsRendered'>;
    };
    NoResultsFallbackProps?: NoResultsFallbackProps;
    className?: string;
}

export function TableListInPage<T = unknown, C = unknown>({
    queryResult,
    loginRequired = false,
    noResultsFallbackRequired = true,
    VirtualTableListProps,
    NoResultsFallbackProps,
    className,
}: TableListInPageProps<T, C>) {
    const currentSource = useGlobalState.use.currentSource();
    const currentSocialSource = narrowToSocialSource(currentSource);

    const itemsRenderedRef = useRef(false);
    const isLogin = useIsLogin(currentSocialSource);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } = queryResult;

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    const Context = useMemo(
        () => ({
            hasNextPage,
            fetchNextPage,
            isFetching,
            itemsRendered: itemsRenderedRef.current,
            ...VirtualTableListProps?.context,
        }),
        [hasNextPage, fetchNextPage, isFetching, VirtualTableListProps?.context, itemsRenderedRef.current],
    );

    if (loginRequired && !isLogin) {
        return <NotLoginFallback source={currentSocialSource} />;
    }

    if (noResultsFallbackRequired && !data.length) {
        return <NoResultsFallback {...NoResultsFallbackProps} />;
    }

    const List = VirtualTableList<T, C>;

    return (
        <div className={className}>
            <List
                useWindowScroll
                data={data}
                endReached={onEndReached}
                {...VirtualTableListProps}
                itemSize={(el: HTMLElement) => {
                    if (!itemsRenderedRef.current) itemsRenderedRef.current = true;
                    return el.getBoundingClientRect().height;
                }}
                context={Context as C}
                components={(VirtualTableListProps?.components ?? EMPTY_OBJECT) as TableComponents<T, C>}
                className={classNames('max-md:no-scrollbar', VirtualTableListProps?.className)}
            />
            <VirtualListFooter context={Context} />
        </div>
    );
}
