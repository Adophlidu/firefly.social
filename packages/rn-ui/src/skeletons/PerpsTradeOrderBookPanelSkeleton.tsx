import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 4 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#F1F2F5" />;
}

export const PerpsTradeOrderBookPanelSkeleton = memo(function PerpsTradeOrderBookPanelSkeleton() {
    return (
        <YStack width="100%" justifyContent="space-between" alignSelf="stretch">
            <YStack gap={4}>
                <YStack gap={2}>
                    <SkeletonBlock width={120} height={14} radius={6} />
                    <SkeletonBlock width={90} height={14} radius={6} />
                </YStack>

                <XStack alignItems="center" gap={4}>
                    <YStack flex={1} gap={2}>
                        <SkeletonBlock width={50} height={14} radius={6} />
                        <SkeletonBlock width={40} height={14} radius={6} />
                    </YStack>
                    <SkeletonBlock width={80} height={14} radius={6} />
                </XStack>

                <YStack gap={2}>
                    {Array.from({ length: 9 }, (_, index) => (
                        <XStack key={`ask-skeleton-${index}`} height={24} alignItems="center" width="100%" gap={4}>
                            <SkeletonBlock width={112} height={18} radius={4} />
                            <YStack flex={1}>
                                <SkeletonBlock width="100%" height={18} radius={4} />
                            </YStack>
                        </XStack>
                    ))}
                </YStack>
            </YStack>

            <YStack gap={4}>
                <SkeletonBlock width={88} height={24} radius={6} />

                <YStack gap={2}>
                    {Array.from({ length: 9 }, (_, index) => (
                        <XStack key={`bid-skeleton-${index}`} height={24} alignItems="center" width="100%" gap={4}>
                            <SkeletonBlock width={112} height={18} radius={4} />
                            <YStack flex={1}>
                                <SkeletonBlock width="100%" height={18} radius={4} />
                            </YStack>
                        </XStack>
                    ))}
                </YStack>

                <SkeletonBlock width="100%" height={24} radius={4} />
            </YStack>
        </YStack>
    );
});
