import { type ISubscription } from '@nktkas/hyperliquid';
import { memo, useEffect, useMemo, useState } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { useHyperliquid } from '@/hooks/useHyperliquid';

interface OrderBookProps {
    coin: string;
    buyLabel?: string;
    sellLabel?: string;
    unitLabel?: string;
    rows?: number;
}
interface OrderBookLevel {
    px: string;
    sz: string;
    n: number;
}

interface OrderBookData {
    levels: [OrderBookLevel[], OrderBookLevel[]];
}

const formatAmount = (value: string | number | undefined) => {
    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) {
        return '--';
    }

    return numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatPrice = (value: string | number | undefined) => {
    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) {
        return '--';
    }

    if (numericValue > 0 && numericValue < 10) {
        return `${(numericValue * 100).toFixed(1)}c`;
    }

    if (numericValue >= 1000) {
        return numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }

    return numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
};

export const OrderBook = memo<OrderBookProps>(function OrderBook({
    coin,
    buyLabel = 'Buy(USDC)',
    sellLabel = 'Sell(USDC)',
    unitLabel = '0.1',
    rows: rowLimit = 12,
}) {
    const { subscriptionClient } = useHyperliquid();
    const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);

    const { bids, asks } = useMemo(
        () => ({
            bids: orderBook?.levels?.[0] || [],
            asks: orderBook?.levels?.[1] || [],
        }),
        [orderBook],
    );

    const maxRows = rowLimit;
    const rows = useMemo(() => {
        const size = Math.max(bids.length, asks.length, maxRows);

        return Array.from({ length: Math.min(size, maxRows) }, (_, index) => {
            const bid = bids[index];
            const ask = asks[index];

            return {
                id: `${coin}-${index}`,
                bid,
                ask,
            };
        });
    }, [asks, bids, coin, maxRows]);

    const [maxBidSize, maxAskSize] = useMemo(() => {
        const bidMax = bids.reduce((acc, item) => {
            const current = Number(item.sz || 0);
            return Number.isFinite(current) ? Math.max(acc, current) : acc;
        }, 0);

        const askMax = asks.reduce((acc, item) => {
            const current = Number(item.sz || 0);
            return Number.isFinite(current) ? Math.max(acc, current) : acc;
        }, 0);

        return [bidMax || 1, askMax || 1];
    }, [asks, bids]);

    useEffect(() => {
        if (!coin) {
            setOrderBook(null);
            return;
        }

        let active = true;
        let subscription: ISubscription;

        subscriptionClient
            .l2Book({ coin }, (data) => {
                if (active) {
                    setOrderBook(data);
                }
            })
            .then((sub) => {
                subscription = sub;
            });

        return () => {
            active = false;
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [subscriptionClient, coin]);

    const hasAnyLevel = bids.length > 0 || asks.length > 0;

    return (
        <YStack
            width="100%"
            backgroundColor="#FFFFFF"
            borderRadius={12}
            paddingHorizontal={12}
            paddingTop={8}
            paddingBottom={10}
            gap={4}
        >
            <XStack alignItems="center" paddingBottom={2}>
                <XStack width="50%" minWidth={0} paddingRight={4}>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        {buyLabel}
                    </Text>
                </XStack>

                <Button
                    unstyled
                    backgroundColor="#F8F7F9"
                    borderRadius={96}
                    height={24}
                    paddingHorizontal={8}
                    alignItems="center"
                    gap={4}
                    pressStyle={{ opacity: 0.75 }}
                >
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {unitLabel}
                    </Text>

                    <Text color="#171717" fontSize={11} lineHeight={14}>
                        {'<>'}
                    </Text>
                </Button>

                <XStack width="50%" minWidth={0} justifyContent="flex-end" paddingLeft={4}>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        {sellLabel}
                    </Text>
                </XStack>
            </XStack>

            {!coin ? (
                <XStack justifyContent="center" paddingVertical={10}>
                    <Text color="rgba(70, 70, 70, 0.6)" fontSize={12} lineHeight={14}>
                        Select a market to view the order book
                    </Text>
                </XStack>
            ) : null}

            {coin && !hasAnyLevel ? (
                <YStack gap={6} paddingVertical={4}>
                    {Array.from({ length: maxRows }, (_, index) => (
                        <XStack key={index} width="100%" gap={8}>
                            <YStack flex={1} height={22} borderRadius={6} backgroundColor="#F1F2F5" />
                            <YStack flex={1} height={22} borderRadius={6} backgroundColor="#F1F2F5" />
                        </XStack>
                    ))}
                </YStack>
            ) : null}

            {coin && hasAnyLevel
                ? rows.map((row) => {
                      const bidSize = Number(row.bid?.sz || 0);
                      const askSize = Number(row.ask?.sz || 0);
                      const bidRatio = Math.min(1, Math.max(0, bidSize / maxBidSize));
                      const askRatio = Math.min(1, Math.max(0, askSize / maxAskSize));
                      const bidWidth = `${Math.max(0.06, bidRatio) * 100}%`;
                      const askWidth = `${Math.max(0.06, askRatio) * 100}%`;

                      const bidAmount = row.bid ? formatAmount(row.bid.sz) : '--';
                      const askAmount = row.ask ? formatAmount(row.ask.sz) : '--';
                      const bidPrice = row.bid ? formatPrice(row.bid.px) : '--';
                      const askPrice = row.ask ? formatPrice(row.ask.px) : '--';

                      return (
                          <XStack key={row.id} width="100%" alignItems="center">
                              <XStack
                                  width="50%"
                                  minWidth={0}
                                  position="relative"
                                  overflow="hidden"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  height={22}
                                  paddingRight={4}
                              >
                                  <YStack
                                      position="absolute"
                                      right={0}
                                      top={0}
                                      bottom={0}
                                      width={bidWidth}
                                      zIndex={0}
                                      pointerEvents="none"
                                      backgroundColor="rgba(220, 241, 217, 0.62)"
                                  />

                                  <Text zIndex={1} color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {bidAmount}
                                  </Text>

                                  <Text zIndex={1} color="#48AD3C" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {bidPrice}
                                  </Text>
                              </XStack>

                              <XStack
                                  width="50%"
                                  minWidth={0}
                                  position="relative"
                                  overflow="hidden"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  height={22}
                                  paddingLeft={4}
                              >
                                  <YStack
                                      position="absolute"
                                      left={0}
                                      top={0}
                                      bottom={0}
                                      width={askWidth}
                                      zIndex={0}
                                      pointerEvents="none"
                                      backgroundColor="rgba(255, 230, 228, 0.62)"
                                  />

                                  <Text zIndex={1} color="#FF564D" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {askPrice}
                                  </Text>

                                  <Text zIndex={1} color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {askAmount}
                                  </Text>
                              </XStack>
                          </XStack>
                      );
                  })
                : null}
        </YStack>
    );
});
