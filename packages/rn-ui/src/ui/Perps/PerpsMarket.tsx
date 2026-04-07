import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { LiteTabs } from '@/components/LiteTabs';
import { PerpsMarketList } from '@/components/PerpsMarketList';
import { SearchInput } from '@/components/SearchInput';
import { SortByFilter } from '@/components/SortByFilter';
import { loadPerpsMarketPage } from '@/services/perpsMarket';
import { PerpsMarketSkeleton } from '@/skeletons/PerpsMarketSkeleton';
import { type FetchPerpsMarketPage } from '@/types/services';
import type {
    PerpsMarketItem,
    PerpsMarketSort,
    PerpsMarketSortItem,
    PerpsMarketTab,
    PerpsMarketTabItem,
} from '@/types/ui';

export interface PerpsMarketProps {
    onMarketSelect?: (item: PerpsMarketItem) => void;
    fetchPerpsMarketPage?: FetchPerpsMarketPage;
    pageSize?: number;
}

export const PerpsMarket = memo<PerpsMarketProps>(function PerpsMarket({
    onMarketSelect,
    fetchPerpsMarketPage,
    pageSize = 12,
}) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<PerpsMarketTab>('perps');
    const [activeSort, setActiveSort] = useState<PerpsMarketSort>('volume');
    const [tabs, setTabs] = useState<PerpsMarketTabItem[]>([
        { label: 'Favorites', value: 'favorites' },
        { label: 'Perps', value: 'perps' },
        { label: 'Crypto', value: 'crypto' },
        { label: 'Stocks', value: 'stocks' },
        { label: 'Commodities', value: 'commodities' },
    ]);
    const [sortOptions, setSortOptions] = useState<PerpsMarketSortItem[]>([
        { label: 'Volume', value: 'volume' },
        { label: 'Price Change', value: 'priceChange' },
        { label: 'Open Interest', value: 'openInterest' },
    ]);
    const [items, setItems] = useState<PerpsMarketItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useMemo(() => fetchPerpsMarketPage ?? loadPerpsMarketPage, [fetchPerpsMarketPage]);

    const loadPage = useCallback(
        async (nextPage: number, append: boolean) => {
            const response = await loadData({
                tab: activeTab,
                sortBy: activeSort,
                page: nextPage,
                pageSize,
            });

            setTabs(response.tabs);
            setSortOptions(response.sortOptions);
            setItems((prev) => (append ? [...prev, ...response.items] : response.items));
            setPage(nextPage);
            setHasMore(response.hasMore);
        },
        [activeSort, activeTab, loadData, pageSize],
    );

    const loadFirstPage = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await loadPage(1, false);
        } catch {
            setError('Failed to load markets');
        } finally {
            setLoading(false);
            setInitialized(true);
        }
    }, [loadPage]);

    const loadMore = useCallback(async () => {
        if (loading || loadingMore || !hasMore) return;

        setLoadingMore(true);
        setError(null);

        try {
            await loadPage(page + 1, true);
        } catch {
            setError('Failed to load more markets');
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadPage, loading, loadingMore, page]);

    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        setError(null);
        loadFirstPage();
    }, [activeSort, activeTab, loadFirstPage]);

    const normalizedSearch = search.trim().toLowerCase();
    const visibleItems = useMemo(() => {
        if (!normalizedSearch) {
            return items;
        }

        return items.filter((item) => {
            return [item.symbol, item.volumeLabel, item.priceLabel, item.priceChangeLabel, item.leverage]
                .join(' ')
                .toLowerCase()
                .includes(normalizedSearch);
        });
    }, [items, normalizedSearch]);

    const showFullSkeleton = loading && !initialized;

    if (showFullSkeleton) {
        return <PerpsMarketSkeleton mode="full" />;
    }

    return (
        <YStack height="100%" minHeight={0} backgroundColor="#FFFFFF">
            <YStack flexShrink={0} alignItems="center" gap={8} paddingTop={12} paddingBottom={10}>
                <Text color="#000000" fontSize={20} lineHeight={24} fontWeight={600}>
                    Perps
                </Text>
            </YStack>

            <YStack flex={1} minHeight={0} gap={12} paddingHorizontal={16} paddingTop={10}>
                <SearchInput value={search} onChange={setSearch} />

                <XStack flexShrink={0} height={44}>
                    <LiteTabs
                        value={activeTab}
                        data={tabs}
                        onChange={(value) => {
                            setActiveTab(value as PerpsMarketTab);
                        }}
                    />
                </XStack>

                <XStack flexShrink={0} justifyContent="flex-start">
                    <SortByFilter
                        data={sortOptions}
                        value={activeSort}
                        onChange={(value) => {
                            setActiveSort(value as PerpsMarketSort);
                        }}
                    />
                </XStack>

                <PerpsMarketList
                    items={visibleItems}
                    loading={loading}
                    loadingMore={loadingMore}
                    error={error}
                    onLoadMore={loadMore}
                    onMarketSelect={onMarketSelect}
                />
            </YStack>
        </YStack>
    );
});
