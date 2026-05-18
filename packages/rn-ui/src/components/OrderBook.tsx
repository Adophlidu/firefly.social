import { Trans } from '@lingui/react/macro';
import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { OrderBookStepPopover } from '@/components/OrderBookStepPopover';
import { formatCoinName } from '@/helpers/formatCoinName';
import { useOrderBook } from '@/hooks/Perps/useOrderBook';
import { useOrderBookSteps } from '@/hooks/Perps/useOrderBookSteps';
import { SwitchIcon } from '@/icons/SwitchIcon';
import { orderBookStepIndexAtom } from '@/store/global';

interface OrderBookProps {
    coin: string;
    szDecimal: number;
    midPrice: string;
    rows?: number;
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

export const OrderBook = memo<OrderBookProps>(function OrderBook({ coin, rows: rowLimit = 15, szDecimal, midPrice }) {
    const theme = useTheme();
    const stepIndex = useAtomValue(orderBookStepIndexAtom);
    const steps = useOrderBookSteps(midPrice, szDecimal);
    const { asks, bids } = useOrderBook(coin, rowLimit, stepIndex, false);

    const coinName = formatCoinName(coin);

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

    const hasAnyLevel = bids.length > 0 || asks.length > 0;

    return (
        <YStack
            width="100%"
            backgroundColor="$bg"
            borderRadius={12}
            paddingHorizontal={12}
            paddingTop={8}
            paddingBottom={10}
            gap={4}
        >
            <XStack alignItems="center" paddingBottom={2} justifyContent="space-between">
                <Text color="$textSubdued" fontSize={12} lineHeight={14}>
                    <Trans id="rn-ui.OrderBook.buy">Buy({coinName})</Trans>
                </Text>

                <OrderBookStepPopover placement="top" midPrice={midPrice} szDecimals={szDecimal}>
                    <Button
                        unstyled
                        backgroundColor="$bgSubdued"
                        borderRadius={96}
                        height={22}
                        paddingHorizontal={8}
                        alignItems="center"
                        gap={4}
                        pressStyle={{ opacity: 0.75 }}
                    >
                        <XStack height="100%" alignItems="center" gap={4}>
                            <Text fontSize={12} fontWeight={500} color="$text">
                                {steps[stepIndex] ?? '-'}
                            </Text>
                            <SwitchIcon stroke={theme.text!.get()} />
                        </XStack>
                    </Button>
                </OrderBookStepPopover>

                <Text color="$textSubdued" fontSize={12} lineHeight={14}>
                    <Trans id="rn-ui.OrderBook.sell">Sell({coinName})</Trans>
                </Text>
            </XStack>

            {coin && !hasAnyLevel ? (
                <YStack gap={6} paddingVertical={4}>
                    {Array.from({ length: maxRows }, (_, index) => (
                        <XStack key={index} width="100%" gap={8}>
                            <YStack flex={1} height={22} borderRadius={6} backgroundColor="$bgSubdued" />
                            <YStack flex={1} height={22} borderRadius={6} backgroundColor="$bgSubdued" />
                        </XStack>
                    ))}
                </YStack>
            ) : null}

            {coin && hasAnyLevel
                ? rows.map((row) => {
                      const bidWidth = `${Math.max(0.06, row.bid?.ratio || 0) * 100}%`;
                      const askWidth = `${Math.max(0.06, row.ask?.ratio || 0) * 100}%`;

                      const bidAmount = row.bid ? formatAmount(row.bid.cumulativeSz) : '--';
                      const askAmount = row.ask ? formatAmount(row.ask.cumulativeSz) : '--';
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
                                      backgroundColor="$bgSuccessSubdued"
                                  />

                                  <Text zIndex={1} color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {bidAmount}
                                  </Text>

                                  <Text zIndex={1} color="$textSuccess" fontSize={12} lineHeight={14} fontWeight={500}>
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
                                      backgroundColor="$bgCriticalSubdued"
                                  />

                                  <Text zIndex={1} color="$textCritical" fontSize={12} lineHeight={14} fontWeight={500}>
                                      {askPrice}
                                  </Text>

                                  <Text zIndex={1} color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
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
