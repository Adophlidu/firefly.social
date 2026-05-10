import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="$bgHover" />;
}

export const TradingHistorySkeleton = memo(function TradingHistorySkeleton() {
    return (
        <YStack gap={12} paddingBottom={16}>
            {Array.from({ length: 4 }, (_, index) => (
                <YStack
                    key={index}
                    backgroundColor="$bg"
                    borderWidth={1}
                    borderColor="$border"
                    borderRadius={12}
                    padding={12}
                    gap={12}
                >
                    <XStack alignItems="center" gap={8}>
                        <SkeletonBlock width={36} height={36} radius={18} />

                        <YStack flex={1} gap={6}>
                            <SkeletonBlock width="42%" height={14} />
                            <SkeletonBlock width="30%" height={12} />
                        </YStack>

                        <SkeletonBlock width={56} height={14} />
                    </XStack>

                    <XStack gap={8}>
                        <YStack flex={1} gap={6}>
                            <SkeletonBlock width="70%" height={14} />
                            <SkeletonBlock width="48%" height={12} />
                        </YStack>

                        <YStack flex={1} gap={6}>
                            <SkeletonBlock width="70%" height={14} />
                            <SkeletonBlock width="48%" height={12} />
                        </YStack>

                        <YStack flex={1} gap={6}>
                            <SkeletonBlock width="70%" height={14} />
                            <SkeletonBlock width="48%" height={12} />
                        </YStack>
                    </XStack>

                    <SkeletonBlock width="36%" height={12} />
                </YStack>
            ))}
        </YStack>
    );
});
