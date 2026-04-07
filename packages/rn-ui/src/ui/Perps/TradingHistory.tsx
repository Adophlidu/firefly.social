import { memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { loadTradingHistoryPage } from '@/services/tradesHistory';
import { TradingHistorySkeleton } from '@/skeletons/TradingHistorySkeleton';
import { type FetchTradingHistory } from '@/types/services';
import { type TradingHistoryItem } from '@/types/ui';

export interface TradingHistoryProps {
    walletAddress: string;
    pageSize?: number;
    fetchTradingHistory?: FetchTradingHistory;
}

interface TradingHistoryItemCardProps {
    item: TradingHistoryItem;
}

const TradingHistoryItemCard = memo<TradingHistoryItemCardProps>(function TradingHistoryItemCard({ item }) {
    const pnlColor = item.pnl?.startsWith('-') ? '#FF372B' : '#429F37';

    return (
        <YStack backgroundColor="#FFFFFF" borderWidth={1} borderColor="#F0F0F0" borderRadius={12} padding={12} gap={12}>
            <XStack alignItems="center" gap={8}>
                <YStack
                    width={36}
                    height={36}
                    borderRadius={18}
                    backgroundColor="#F8F7F9"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Text color="#171717" fontSize={12} fontWeight={600}>
                        {item.symbol.slice(0, 1)}
                    </Text>
                </YStack>

                <YStack flex={1} gap={2}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.symbol}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        {item.action}
                    </Text>
                </YStack>

                {item.pnl ? (
                    <Text color={pnlColor} fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.pnl}
                    </Text>
                ) : null}
            </XStack>

            <XStack gap={8}>
                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.price}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Price
                    </Text>
                </YStack>

                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.positionSize}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Position Size
                    </Text>
                </YStack>

                <YStack flex={1}>
                    <Text color="#181818" fontSize={14} lineHeight={20} fontWeight={600}>
                        {item.tradeValue}
                    </Text>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Trade Value
                    </Text>
                </YStack>
            </XStack>

            <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                {item.timestamp}
            </Text>
        </YStack>
    );
});

export const TradingHistory = memo<TradingHistoryProps>(function TradingHistory({
    walletAddress,
    pageSize = 20,
    fetchTradingHistory,
}) {
    const [items, setItems] = useState<TradingHistoryItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPage = useCallback(
        async (nextPage: number, append: boolean) => {
            if (!walletAddress) return;

            const loadTradingHistory = fetchTradingHistory ?? loadTradingHistoryPage;
            const response = await loadTradingHistory({ walletAddress, page: nextPage, pageSize });

            setItems((prev) => (append ? [...prev, ...response.items] : response.items));
            setPage(nextPage);
            setHasMore(response.hasMore);
        },
        [walletAddress, pageSize, fetchTradingHistory],
    );

    const loadFirstPage = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await loadPage(1, false);
        } catch {
            setError('Failed to load trading history');
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
            setError('Failed to load more trading history');
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
        return <TradingHistorySkeleton />;
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
                    <TradingHistoryItemCard key={item.id} item={item} />
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
