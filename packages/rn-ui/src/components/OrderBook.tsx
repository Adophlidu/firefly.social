import { type ISubscription } from '@nktkas/hyperliquid';
import { memo, useEffect, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { useHyperliquid } from '@/hooks/useHyperliquid';

interface OrderBookProps {
    coin: string;
}
interface OrderBookLevel {
    px: string;
    sz: string;
    n: number;
}

interface OrderBookData {
    levels: [OrderBookLevel[], OrderBookLevel[]];
}

export const OrderBook = memo<OrderBookProps>(function OrderBook({ coin }) {
    const { subscriptionClient } = useHyperliquid();
    const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);

    useEffect(() => {
        if (!coin) return;

        let subscription: ISubscription;
        subscriptionClient
            .l2Book({ coin }, (data) => {
                setOrderBook(data);
            })
            .then((sub) => {
                subscription = sub;
            });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [subscriptionClient, coin]);

    if (!coin) {
        return (
            <XStack>
                <Text>Select a market to view the order book.</Text>
            </XStack>
        );
    }
    if (!orderBook?.levels?.length) {
        return (
            <XStack>
                <Text>No order book data available for {coin}.</Text>
            </XStack>
        );
    }

    return (
        <YStack borderWidth={1} borderColor="$border" gap={8} padding={12} borderRadius={8}>
            <XStack justifyContent="center">
                <Text>Order Book for {coin}</Text>
            </XStack>
            <XStack gap={16}>
                <YStack flex={1} gap={12}>
                    <Text>Bids</Text>
                    {orderBook?.levels?.[0].map((data) => (
                        <Text key={data.px}>
                            {data.sz} @ {data.px}
                        </Text>
                    ))}
                </YStack>
                <YStack flex={1} gap={12}>
                    <Text>Asks</Text>
                    {orderBook?.levels?.[1].map((data) => (
                        <Text key={data.px}>
                            {data.sz} @ {data.px}
                        </Text>
                    ))}
                </YStack>
            </XStack>
        </YStack>
    );
});
