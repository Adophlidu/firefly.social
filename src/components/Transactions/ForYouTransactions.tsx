'use client';

import { ListInPage } from '@/components/ListInPage.js';
import { getForYouTransactions } from '@/components/Transactions/getTransactions.js';
import { getTransactionsItemContent } from '@/components/Transactions/getTransactionsItemContent.js';
import { shuffleTransactions } from '@/components/Transactions/shuffleTransactions.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

export function ForYouTransactions() {
    const { selectedChainId } = useSwapStateStore();

    const queryResult = useMultiInfiniteQueryPageable<TransactionsItem, Pageable<TransactionsItem, PageIndicator>>(
        ['transactions', 'discover', selectedChainId],
        ([Source.NFTs] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const result = await getForYouTransactions(source, pageParam, selectedChainId || undefined);

                return result;
            },
        })),
        (data) => data.pages.flatMap((page) => page.data),
        shuffleTransactions,
    );

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Transactions}:for-you`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) => getTransactionsItemContent(item, index, ScrollListKey.ForYou),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
