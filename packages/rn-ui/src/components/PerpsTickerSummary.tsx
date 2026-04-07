import { memo } from 'react';
import { Text, XStack, YStack } from 'tamagui';

import { type PerpsDetailTicker } from '@/types/ui';

interface PerpsTickerSummaryProps {
    ticker: PerpsDetailTicker;
}

export const PerpsTickerSummary = memo<PerpsTickerSummaryProps>(function PerpsTickerSummary({ ticker }) {
    return (
        <XStack justifyContent="space-between" alignItems="flex-start" gap={12} width="100%">
            <YStack gap={2}>
                <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                    Last Price
                </Text>

                <Text color="#429F37" fontSize={24} lineHeight={32} fontWeight={700}>
                    {ticker.lastPriceLabel}
                </Text>

                <XStack gap={4} alignItems="center">
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {ticker.usdPriceLabel}
                    </Text>
                    <Text color="#429F37" fontSize={12} lineHeight={14} fontWeight={500}>
                        {ticker.priceChangeLabel}
                    </Text>
                </XStack>

                <XStack gap={4} alignItems="center">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Mark Price
                    </Text>
                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                        {ticker.markPriceLabel}
                    </Text>
                </XStack>
            </YStack>

            <YStack width={160} gap={8} paddingTop={4}>
                {ticker.stats.map((item) => {
                    return (
                        <XStack key={item.label} alignItems="center" justifyContent="space-between">
                            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                {item.label}
                            </Text>

                            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                {item.value}
                            </Text>
                        </XStack>
                    );
                })}
            </YStack>
        </XStack>
    );
});
