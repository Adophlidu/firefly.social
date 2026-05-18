import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { NoDataFallback } from '@/components/NoDataFallback';
import { PerpsMarketRow } from '@/components/PerpsMarketRow';
import { PerpsMarketSkeleton } from '@/skeletons/PerpsMarketSkeleton';
import type { PerpsMeta } from '@/types/ui';

export interface PerpsMarketListProps {
    items: PerpsMeta[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    onLoadMore?: () => void;
    onMarketSelect?: (item: PerpsMeta) => void;
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
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (loading || loadingMore) return;
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;

            if (isNearBottom) {
                onLoadMore?.();
            }
        },
        [loading, loadingMore, onLoadMore],
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
                    ? items.map((item) => <PerpsMarketRow key={item.name} item={item} onPress={onMarketSelect} />)
                    : null}

                {!loading && error ? (
                    <XStack justifyContent="center" paddingTop={4}>
                        <Text color="$textCritical" fontSize={12} lineHeight={14}>
                            {error}
                        </Text>
                    </XStack>
                ) : null}

                {!loading && !error && items.length === 0 ? (
                    <XStack justifyContent="center" paddingTop={4}>
                        <NoDataFallback message={<Trans id="rn-ui.market.empty">No markets found</Trans>} hideButton />
                    </XStack>
                ) : null}

                {loadingMore ? <PerpsMarketSkeleton mode="list" rows={2} /> : null}
            </YStack>
        </ScrollView>
    );
});
