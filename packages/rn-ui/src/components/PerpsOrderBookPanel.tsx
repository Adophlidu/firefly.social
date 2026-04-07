import { memo } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { type PerpsOrderBookLevel, type PerpsOrderBookPanel as PerpsOrderBookPanelData } from '@/types/ui';

interface PerpsOrderBookPanelProps {
    orderBook: PerpsOrderBookPanelData;
}

interface PerpsOrderBookRowProps {
    level: PerpsOrderBookLevel;
}

const PerpsOrderBookRow = memo<PerpsOrderBookRowProps>(function PerpsOrderBookRow({ level }) {
    const buyDepthPercent = `${Math.max(0, Math.min(1, level.buyDepthRatio)) * 100}%`;
    const sellDepthPercent = `${Math.max(0, Math.min(1, level.sellDepthRatio)) * 100}%`;

    return (
        <XStack width="100%" alignItems="center">
            <XStack
                flex={1}
                position="relative"
                alignItems="center"
                justifyContent="space-between"
                paddingVertical={4}
                paddingRight={4}
            >
                <YStack
                    position="absolute"
                    right={0}
                    top={2}
                    bottom={2}
                    width={buyDepthPercent}
                    backgroundColor="rgba(72, 173, 60, 0.18)"
                />

                <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                    {level.buyAmountLabel}
                </Text>

                <Text color="#48AD3C" fontSize={12} lineHeight={14} fontWeight={500}>
                    {level.buyPriceLabel}
                </Text>
            </XStack>

            <XStack
                flex={1}
                position="relative"
                alignItems="center"
                justifyContent="space-between"
                paddingVertical={4}
                paddingLeft={4}
            >
                <YStack
                    position="absolute"
                    left={0}
                    top={2}
                    bottom={2}
                    width={sellDepthPercent}
                    backgroundColor="rgba(255, 86, 77, 0.18)"
                />

                <Text color="#FF564D" fontSize={12} lineHeight={14} fontWeight={500}>
                    {level.sellPriceLabel}
                </Text>

                <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                    {level.sellAmountLabel}
                </Text>
            </XStack>
        </XStack>
    );
});

export const PerpsOrderBookPanel = memo<PerpsOrderBookPanelProps>(function PerpsOrderBookPanel({ orderBook }) {
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
            <XStack alignItems="center" justifyContent="space-between" paddingBottom={2}>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    {orderBook.buyLabel}
                </Text>

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
                        {orderBook.unitLabel}
                    </Text>

                    <Text color="#171717" fontSize={10} lineHeight={12}>
                        {'<>'}
                    </Text>
                </Button>

                <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14}>
                    {orderBook.sellLabel}
                </Text>
            </XStack>

            {orderBook.levels.map((level) => (
                <PerpsOrderBookRow key={level.id} level={level} />
            ))}
        </YStack>
    );
});
