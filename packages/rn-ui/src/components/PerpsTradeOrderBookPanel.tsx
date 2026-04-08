import { memo } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, XStack, YStack } from 'tamagui';

import { type PerpsTradeOrderBook, type PerpsTradeOrderBookEntry } from '@/types/ui';

interface PerpsTradeOrderBookPanelProps {
    orderBook: PerpsTradeOrderBook;
    fundingRate: string;
    countdown: string;
}

function ChevronDownSmallIcon() {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M4.12 6.39L7 9.27C7.39 9.66 8.02 9.66 8.41 9.27L11.29 6.39"
                stroke="#A9A6BC"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function AskRow({ entry }: { entry: PerpsTradeOrderBookEntry }) {
    const barWidth = `${Math.max(4, entry.depthRatio * 100)}%`;

    return (
        <XStack height={24} alignItems="center" width="100%" gap={4}>
            <XStack width={112} alignItems="center" paddingVertical={5} position="relative">
                <YStack
                    position="absolute"
                    left={0}
                    top={0}
                    bottom={0}
                    width={barWidth}
                    backgroundColor="rgba(255, 230, 228, 0.88)"
                />
                <Text color="#FF564D" fontSize={12} lineHeight={14} fontWeight={500} zIndex={1}>
                    {entry.price}
                </Text>
            </XStack>
            <XStack flex={1} alignItems="center" justifyContent="flex-end" paddingVertical={5}>
                <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                    {entry.amount}
                </Text>
            </XStack>
        </XStack>
    );
}

function BidRow({ entry }: { entry: PerpsTradeOrderBookEntry }) {
    const barWidth = `${Math.max(4, entry.depthRatio * 100)}%`;

    return (
        <XStack height={24} alignItems="center" width="100%" gap={4}>
            <XStack width={112} alignItems="center" paddingVertical={5} position="relative">
                <YStack
                    position="absolute"
                    left={0}
                    top={0}
                    bottom={0}
                    width={barWidth}
                    backgroundColor="rgba(220, 241, 217, 0.88)"
                />
                <Text color="#48AD3C" fontSize={12} lineHeight={14} fontWeight={500} zIndex={1}>
                    {entry.price}
                </Text>
            </XStack>
            <XStack flex={1} alignItems="center" justifyContent="flex-end" paddingVertical={5}>
                <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                    {entry.amount}
                </Text>
            </XStack>
        </XStack>
    );
}

export const PerpsTradeOrderBookPanel = memo<PerpsTradeOrderBookPanelProps>(function PerpsTradeOrderBookPanel({
    orderBook,
    fundingRate,
    countdown,
}) {
    return (
        <YStack width="100%" justifyContent="space-between" alignSelf="stretch">
            <YStack gap={4}>
                {/* Funding / Countdown */}
                <YStack>
                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                        Funding / Countdown
                    </Text>
                    <XStack>
                        <Text color="#429F37" fontSize={12} lineHeight={14}>
                            {fundingRate}
                        </Text>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                            {` / ${countdown}`}
                        </Text>
                    </XStack>
                </YStack>

                {/* Column Headers */}
                <XStack alignItems="center" gap={4}>
                    <YStack flex={1}>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                            Price
                        </Text>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                            (USDC)
                        </Text>
                    </YStack>
                    <Text flex={1} color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} textAlign="right">
                        {'Amount\n(USDC)'}
                    </Text>
                </XStack>

                {/* Asks (Sell orders) */}
                <YStack>
                    {orderBook.asks.map((entry, index) => (
                        <AskRow key={`ask-${index}`} entry={entry} />
                    ))}
                </YStack>
            </YStack>

            {/* Last Price */}
            <YStack alignItems="flex-start" justifyContent="center">
                <Text color="#FF564D" fontSize={16} lineHeight={24} fontWeight={600}>
                    {orderBook.lastPrice}
                </Text>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    {orderBook.lastPriceUsd}
                </Text>
            </YStack>

            {/* Bids (Buy orders) + precision selector */}
            <YStack gap={4}>
                <YStack>
                    {orderBook.bids.map((entry, index) => (
                        <BidRow key={`bid-${index}`} entry={entry} />
                    ))}
                </YStack>

                {/* Precision selector */}
                <Button
                    unstyled
                    backgroundColor="#F8F7F9"
                    borderRadius={4}
                    height={24}
                    paddingHorizontal={8}
                    paddingVertical={4}
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                >
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        1
                    </Text>
                    <ChevronDownSmallIcon />
                </Button>
            </YStack>
        </YStack>
    );
});
