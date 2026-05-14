import { memo, useState } from 'react';
import { Button, Text, YStack } from 'tamagui';

import { PerpKlineIntervalPills } from '@/components/PerpKlineChart/PerpKlineIntervalPills.js';
import { PerpKlineRenderer } from '@/components/PerpKlineChart/PerpKlineRenderer.js';
import type { KlineInterval } from '@/components/PerpKlineChart/types.js';
import { useCandleHistory } from '@/hooks/perps/useCandleHistory.js';
import { useUserFillMarkers } from '@/hooks/perps/useUserFillMarkers.js';

export interface PerpKlineChartProps {
    coin: string;
    initialInterval: KlineInterval;
    walletAddress: string | null;
}

export const PerpKlineChart = memo<PerpKlineChartProps>(function PerpKlineChart({
    coin,
    initialInterval,
    walletAddress,
}) {
    const [interval, setInterval] = useState<KlineInterval>(initialInterval);
    const { data: candles, isLoading, error, retry } = useCandleHistory(coin, interval);
    const markers = useUserFillMarkers(coin, walletAddress);

    const showSkeleton = isLoading && candles.length === 0;
    const showError = !!error && candles.length === 0;
    const showChart = !showSkeleton && !showError;

    return (
        <YStack width="100%" height="100%" gap={6} padding={8} backgroundColor="$bg">
            <YStack gap={4}>
                <PerpKlineIntervalPills value={interval} onChange={setInterval} />

                <Text color="$text" fontSize={14} lineHeight={18} fontWeight={600}>
                    {coin}USD · {interval} · Hyperliquid
                </Text>
            </YStack>

            <YStack flex={1} minHeight={0} borderRadius={10} overflow="hidden">
                {showSkeleton ? <YStack width="100%" height="100%" backgroundColor="$bgHover" /> : null}

                {showError ? (
                    <YStack
                        width="100%"
                        height="100%"
                        backgroundColor="$bgSubdued"
                        justifyContent="center"
                        alignItems="center"
                        gap={12}
                    >
                        <Text color="$textSubdued" fontSize={13} lineHeight={17} fontWeight={500}>
                            Chart unavailable
                        </Text>
                        <Button
                            unstyled
                            height={32}
                            paddingHorizontal={16}
                            borderRadius={16}
                            backgroundColor="$bgHover"
                            justifyContent="center"
                            alignItems="center"
                            pressStyle={{ opacity: 0.75 }}
                            onPress={retry}
                        >
                            <Text color="$text" fontSize={13} lineHeight={17} fontWeight={500}>
                                Retry
                            </Text>
                        </Button>
                    </YStack>
                ) : null}

                {showChart ? <PerpKlineRenderer candles={candles} markers={markers} /> : null}
            </YStack>
        </YStack>
    );
});
