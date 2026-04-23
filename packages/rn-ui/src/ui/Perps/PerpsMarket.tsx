import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { LiteTabs } from '@/components/LiteTabs';
import { PerpsMarketList } from '@/components/PerpsMarketList';
import { SearchInput } from '@/components/SearchInput';
import { SortByFilter } from '@/components/SortByFilter';
import { STALE_TIMES } from '@/constants/enum';
import { usePerpsMetas } from '@/hooks/Perps/usePerpsMetas';
import { getPerpsCategories } from '@/services/firefly/getPerpsCategories';
import { PerpsMarketSkeleton } from '@/skeletons/PerpsMarketSkeleton';
import type { PerpsMarketSort, PerpsMarketSortItem, PerpsMarketTab, PerpsMeta } from '@/types/ui';

export interface PerpsMarketProps {
    onMarketSelect?: (item: PerpsMeta) => void;
}

export const PerpsMarket = memo<PerpsMarketProps>(function PerpsMarket({ onMarketSelect }) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [activeSort, setActiveSort] = useState<PerpsMarketSort>('volume');
    const [sortOptions] = useState<PerpsMarketSortItem[]>([
        { label: 'Volume', value: 'volume' },
        { label: 'Price Change', value: 'priceChange' },
        { label: 'Open Interest', value: 'openInterest' },
    ]);

    const { data, isLoading } = useQuery({
        queryKey: ['perps', 'categories'],
        staleTime: STALE_TIMES.HOUR_1,
        queryFn: () => getPerpsCategories(),
    });
    const {
        data: perpsMeta,
        error,
        isGlobalLoading,
        isLoading: isMetaLoading,
    } = usePerpsMetas({ category: activeTab, keyword: search });

    const categories = useMemo(
        () => [
            { label: 'Favorites', value: 'favorites' },
            ...(!data?.length
                ? [{ label: 'All', value: 'all' }]
                : data.map((category) => ({
                      label: category.display_name,
                      value: category.name,
                  }))),
        ],
        [data],
    );

    useEffect(() => {
        if (!isLoading && categories.length > 0) {
            setActiveTab(categories[1]?.value || categories[0]?.value);
        }
    }, [categories, isLoading]);

    const showFullSkeleton = isLoading || isGlobalLoading;

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
                        data={categories}
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
                    items={perpsMeta}
                    loading={isMetaLoading}
                    loadingMore={false}
                    error={error?.message || null}
                    onMarketSelect={onMarketSelect}
                />
            </YStack>
        </YStack>
    );
});
