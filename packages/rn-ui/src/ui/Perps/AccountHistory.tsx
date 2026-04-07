import { memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { loadAccountHistoryPage } from '@/services/tradesHistory';
import { AccountHistorySkeleton } from '@/skeletons/AccountHistorySkeleton';
import { type FetchAccountHistory } from '@/types/services';
import { type AccountHistoryItem } from '@/types/ui';

export interface AccountHistoryProps {
    walletAddress: string;
    pageSize?: number;
    fetchAccountHistory?: FetchAccountHistory;
}

interface AccountHistoryItemCardProps {
    item: AccountHistoryItem;
}

const AccountHistoryItemCard = memo<AccountHistoryItemCardProps>(function AccountHistoryItemCard({ item }) {
    const positive = item.amount.startsWith('+');

    return (
        <XStack
            backgroundColor="#FFFFFF"
            borderWidth={1}
            borderColor="#F0F0F0"
            borderRadius={12}
            padding={12}
            alignItems="center"
            gap={8}
        >
            <YStack
                width={40}
                height={40}
                borderRadius={20}
                backgroundColor="#F8F7F9"
                justifyContent="center"
                alignItems="center"
            >
                <Text color={positive ? '#429F37' : '#FF372B'} fontSize={16} lineHeight={20} fontWeight={600}>
                    {positive ? '\u2193' : '\u2191'}
                </Text>
            </YStack>

            <YStack flex={1} gap={2}>
                <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                    {item.title}
                </Text>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    {item.timeAgo}
                </Text>
            </YStack>

            <Text color={positive ? '#429F37' : '#FF372B'} fontSize={14} lineHeight={20} fontWeight={600}>
                {item.amount}
            </Text>
        </XStack>
    );
});

export const AccountHistory = memo<AccountHistoryProps>(function AccountHistory({
    walletAddress,
    pageSize = 20,
    fetchAccountHistory,
}) {
    const [items, setItems] = useState<AccountHistoryItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (nextPage: number, append: boolean) => {
            if (!walletAddress) return;

            const loadAccountHistory = fetchAccountHistory ?? loadAccountHistoryPage;
            const response = await loadAccountHistory({ walletAddress, page: nextPage, pageSize });

            setItems((prev) => (append ? [...prev, ...response.items] : response.items));
            setPage(nextPage);
            setHasMore(response.hasMore);
        },
        [walletAddress, pageSize, fetchAccountHistory],
    );

    const loadFirstPage = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await loadPage(1, false);
        } catch {
            setError('Failed to load account history');
        } finally {
            setLoading(false);
        }
    }, [loadPage]);

    const loadMore = useCallback(async () => {
        if (loadingMore || loading || !hasMore) return;

        setLoadingMore(true);
        setError(null);

        try {
            await loadPage(page + 1, true);
        } catch {
            setError('Failed to load more account history');
        } finally {
            setLoadingMore(false);
        }
    }, [loadPage, page, hasMore, loading, loadingMore]);

    const handleScroll = useCallback(
        (event: any) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;

            if (isNearBottom) {
                loadMore();
            }
        },
        [loadMore],
    );

    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        setError(null);
        if (!walletAddress) return;
        loadFirstPage();
    }, [walletAddress, loadFirstPage]);

    if (!walletAddress) {
        return (
            <XStack justifyContent="center" paddingVertical={20}>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    Wallet: --
                </Text>
            </XStack>
        );
    }

    if (loading) {
        return <AccountHistorySkeleton />;
    }

    return (
        <ScrollView
            flex={1}
            minHeight={0}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
        >
            <YStack gap={12} paddingBottom={16}>
                {items.map((item) => (
                    <AccountHistoryItemCard key={item.id} item={item} />
                ))}

                {error ? (
                    <XStack justifyContent="center" paddingTop={4}>
                        <Text color="#FF372B" fontSize={12} lineHeight={14}>
                            {error}
                        </Text>
                    </XStack>
                ) : null}

                {loadingMore ? (
                    <XStack justifyContent="center" paddingVertical={4}>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                            Loading more...
                        </Text>
                    </XStack>
                ) : null}
            </YStack>
        </ScrollView>
    );
});
