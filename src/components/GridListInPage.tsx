'use client';

import { classNames } from '@dimensiondev/utils';
import type { UseSuspenseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { GridComponents } from 'react-virtuoso';

import { NoResultsFallback, type NoResultsFallbackProps } from '@/components/NoResultsFallback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { VirtualGridList, type VirtualGridListProps } from '@/components/VirtualList/VirtualGridList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { EMPTY_OBJECT } from '@/constants/index.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export interface GridListInPageProps<T = unknown, C = unknown> {
    queryResult: UseSuspenseInfiniteQueryResult<T[]>;
    loginRequired?: boolean;
    noResultsFallbackRequired?: boolean;
    VirtualGridListProps?: Omit<VirtualGridListProps<T, C>, 'context'> & {
        context?: Omit<C, 'hasNextPage' | 'fetchNextPage' | 'isFetching' | 'itemsRendered'>;
    };
    NoResultsFallbackProps?: NoResultsFallbackProps;
    className?: string;
    hiddenFooter?: boolean;
}

export function GridListInPage<T = unknown, C = unknown>({
    queryResult,
    loginRequired = false,
    noResultsFallbackRequired = true,
    VirtualGridListProps,
    NoResultsFallbackProps,
    hiddenFooter = false,
    className,
}: GridListInPageProps<T, C>) {
    const currentSource = useGlobalState.use.currentSource();
    const currentSocialSource = narrowToSocialSource(currentSource);

    const isLogin = useIsLogin(currentSocialSource);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } = queryResult;

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]);

    if (loginRequired && !isLogin) {
        return <NotLoginFallback source={currentSocialSource} />;
    }

    if (noResultsFallbackRequired && !data.length) {
        return <NoResultsFallback {...NoResultsFallbackProps} />;
    }

    const List = VirtualGridList<T, C>;

    const Context = useMemo(
        () => ({
            hasNextPage,
            fetchNextPage,
            isFetching,
            itemsRendered: true,
            ...VirtualGridListProps?.context,
        }),
        [hasNextPage, fetchNextPage, isFetching, VirtualGridListProps?.context],
    );

    return (
        <div className={className}>
            <List
                useWindowScroll
                data={data}
                endReached={onEndReached}
                {...VirtualGridListProps}
                context={Context as C}
                components={(VirtualGridListProps?.components ?? EMPTY_OBJECT) as GridComponents<C>}
                className={classNames('max-md:no-scrollbar', VirtualGridListProps?.className)}
            />
            {hiddenFooter ? null : <VirtualListFooter context={Context} />}
        </div>
    );
}
