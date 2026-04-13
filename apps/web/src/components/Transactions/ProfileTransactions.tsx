'use client';

import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';

import { ListInPage } from '@/components/ListInPage.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { getProfileTransactions } from '@/components/Transactions/getTransactions.js';
import { getTransactionsItemContent } from '@/components/Transactions/getTransactionsItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import type { TransactionsItem } from '@/providers/types/Firefly.js';
import { useTransactionsStateStore } from '@/store/useTransactionsStore.js';

interface ProfileTransactionsProps {
    address: string;
}

export function ProfileTransactions({ address }: ProfileTransactionsProps) {
    const { selectedChainId } = useTransactionsStateStore(getAddressType(address));
    const addresses = useWalletMixAddresses(address);

    const queryResult = useMultiInfiniteQueryPageable<TransactionsItem, Pageable<TransactionsItem, PageIndicator>>(
        ['profile', 'transactions', address.toLowerCase(), selectedChainId],
        ([Source.Swap, Source.NFTs, Source.Prediction] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const result = await getProfileTransactions(
                    source,
                    address,
                    addresses,
                    pageParam,
                    selectedChainId || undefined,
                );

                return result;
            },
        })),
        (data) => {
            return data.pages.flatMap((page) => page.data).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
        },
    );

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Transactions}:${address}`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) => getTransactionsItemContent(item, index, ScrollListKey.Profile),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
