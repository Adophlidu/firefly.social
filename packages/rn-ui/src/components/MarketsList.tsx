import { memo } from 'react';
import { Button, ScrollView, Text, XStack } from 'tamagui';

import { useAsyncRetry } from '@/hooks/useAsyncRetry';
import { useHyperliquid } from '@/hooks/useHyperliquid';

interface MarketsListProps {
    onMarketSelect?: (market: string) => void;
}

export const MarketsList = memo<MarketsListProps>(function MarketsList({ onMarketSelect }) {
    const { infoClient } = useHyperliquid();
    const { loading, value, error, retry } = useAsyncRetry(async () => {
        try {
            const res = await infoClient.meta();
            if (Array.isArray(res?.universe)) {
                return res.universe;
            }

            return [];
        } catch {
            return [];
        }
    }, []);

    if (loading) {
        return (
            <XStack justifyContent="center" alignItems="center" padding={20}>
                <Text>Loading...</Text>
            </XStack>
        );
    }
    if (error) {
        return (
            <XStack justifyContent="center" alignItems="center" padding={20}>
                <Button onPress={retry}>Retry</Button>
            </XStack>
        );
    }
    if (!value?.length) {
        return (
            <XStack justifyContent="center" alignItems="center" padding={20}>
                <Text>No markets found</Text>
            </XStack>
        );
    }

    return (
        <ScrollView>
            {value.map((market) => (
                <XStack
                    height={30}
                    gap="$4"
                    alignItems="center"
                    key={market.name}
                    onPress={() => {
                        onMarketSelect?.(market.name);
                    }}
                >
                    <Text>{market.name}</Text>
                    <Text>{market.maxLeverage || '-'}x</Text>
                </XStack>
            ))}
        </ScrollView>
    );
});
