'use client';

import { shuffle } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { getFollowingTransactions } from '@/components/Transactions/getTransactions.js';
import { getTransactionsItemContent } from '@/components/Transactions/getTransactionsItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

function shuffleTransactions(list: TransactionsItem[]) {
    const count = Math.floor(Math.random() * 3 + 1); // [1, 3]
    const preferredSwaps: TransactionsItem[] = [];
    const others: TransactionsItem[] = [];

    list.forEach((item) => {
        if (preferredSwaps.length < count && item.source === Source.Swap) {
            preferredSwaps.push(item);
        } else {
            others.push(item);
        }
    });

    return preferredSwaps.concat(shuffle(others));
}

export function FollowingTransactions() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const asyncStatusAll = useAsyncStatusAll();

    const { selectedChainId } = useSwapStateStore();

    const queryResult = useMultiInfiniteQueryPageable<TransactionsItem, Pageable<TransactionsItem, PageIndicator>>(
        ['transactions', 'following', asyncStatusAll, selectedChainId, profileIds],
        ([Source.Swap, Source.Polymarket] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                if (!isLogin) return createPageable([], createIndicator(undefined, pageParam));

                const result = await getFollowingTransactions(source, pageParam, selectedChainId || undefined);

                return result;
            },
        })),
        (data) => data.pages.flatMap((page) => page.data),
        { formatter: shuffleTransactions },
    );

    if (!profileIds.length) {
        return <NotLoginFallback source={Source.Polymarket} />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Transactions}:following`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) =>
                    getTransactionsItemContent(item, index, `${ScrollListKey.Transactions}:following`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
