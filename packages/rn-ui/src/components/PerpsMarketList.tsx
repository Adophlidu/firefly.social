import { memo, useCallback } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { PerpsMarketRow } from '@/components/PerpsMarketRow';
import { PerpsMarketSkeleton } from '@/skeletons/PerpsMarketSkeleton';
import { type PerpsMarketItem } from '@/types/ui';

export interface PerpsMarketListProps {
    items: PerpsMarketItem[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    onLoadMore: () => void;
    onMarketSelect?: (item: PerpsMarketItem) => void;
}

export const PerpsMarketList = memo<PerpsMarketListProps>(function PerpsMarketList({
    items,
    loading,
    loadingMore,
    error,
    onLoadMore,
    onMarketSelect,
}) {
    const handleScroll = useCallback(
        (event: any) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;

            if (isNearBottom) {
                onLoadMore();
            }
        },
        [onLoadMore],
    );

    return (
        <ScrollView
            flex={1}
            minHeight={0}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
        >
            <YStack gap={12} paddingBottom={28}>
                {loading ? <PerpsMarketSkeleton mode="list" rows={4} /> : null}

                {!loading
                    ? items.map((item) => <PerpsMarketRow key={item.id} item={item} onPress={onMarketSelect} />)
                    : null}

                {!loading && error ? (
                    <XStack justifyContent="center" paddingTop={4}>
                        <Text color="#FF372B" fontSize={12} lineHeight={14}>
                            {error}
                        </Text>
                    </XStack>
                ) : null}

                {!loading && !error && items.length === 0 ? (
                    <XStack justifyContent="center" paddingTop={4}>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                            No markets found
                        </Text>
                    </XStack>
                ) : null}

                {loadingMore ? <PerpsMarketSkeleton mode="list" rows={2} /> : null}
            </YStack>
        </ScrollView>
    );
});
