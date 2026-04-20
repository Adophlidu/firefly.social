'use client';

import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';

import { ListInPage } from '@/components/ListInPage.js';
import { getForYouTransactions } from '@/components/Transactions/getTransactions.js';
import { getTransactionsItemContent } from '@/components/Transactions/getTransactionsItemContent.js';
import { shuffleTransactions } from '@/components/Transactions/shuffleTransactions.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

export function ForYouTransactions() {
    const { selectedChainId } = useTransactionsStateStore(NetworkType.Ethereum);

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
        { formatter: shuffleTransactions },
    );

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Transactions}:for-you`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) =>
                    getTransactionsItemContent(item, index, `${ScrollListKey.Transactions}:for-you`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
