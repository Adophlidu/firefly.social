import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

function SkeletonPositionCard() {
    return (
        <YStack borderWidth={1} borderColor="#F0F0F0" borderRadius={12} padding={12} gap={12}>
            <YStack gap={4}>
                <XStack justifyContent="space-between">
                    <SkeletonBlock width={60} height={14} radius={6} />
                    <SkeletonBlock width={80} height={14} radius={6} />
                </XStack>
                <XStack justifyContent="space-between">
                    <XStack gap={4}>
                        <SkeletonBlock width={32} height={18} radius={10} />
                        <SkeletonBlock width={48} height={18} radius={10} />
                        <SkeletonBlock width={24} height={18} radius={10} />
                    </XStack>
                    <SkeletonBlock width={120} height={14} radius={6} />
                </XStack>
            </YStack>
            <XStack gap={8}>
                <SkeletonBlock width="33%" height={34} radius={6} />
                <SkeletonBlock width="33%" height={34} radius={6} />
                <SkeletonBlock width="33%" height={34} radius={6} />
            </XStack>
            <XStack gap={8}>
                <SkeletonBlock width="33%" height={34} radius={6} />
                <SkeletonBlock width="33%" height={34} radius={6} />
                <SkeletonBlock width="33%" height={34} radius={6} />
            </XStack>
            <SkeletonBlock width={160} height={14} radius={6} />
            <XStack gap={12}>
                <SkeletonBlock width="33%" height={30} radius={22} />
                <SkeletonBlock width="33%" height={30} radius={22} />
                <SkeletonBlock width="33%" height={30} radius={22} />
            </XStack>
        </YStack>
    );
}

export const PerpsTradeDetailSkeleton = memo(function PerpsTradeDetailSkeleton() {
    return (
        <YStack fullscreen backgroundColor="#FFFFFF" minHeight={0}>
            {/* Top bar */}
            <XStack height={44} alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
                <SkeletonBlock width={24} height={24} radius={12} />
                <SkeletonBlock width={60} height={24} radius={10} />
                <SkeletonBlock width={80} height={32} radius={16} />
            </XStack>

            {/* Token name header */}
            <YStack paddingHorizontal={12} paddingVertical={8} gap={4}>
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack gap={4} alignItems="center">
                        <SkeletonBlock width={120} height={24} radius={8} />
                        <SkeletonBlock width={32} height={18} radius={10} />
                    </XStack>
                    <SkeletonBlock width={24} height={24} radius={12} />
                </XStack>
                <XStack gap={4}>
                    <SkeletonBlock width={32} height={14} radius={6} />
                    <SkeletonBlock width={48} height={14} radius={6} />
                </XStack>
            </YStack>

            {/* Order Book + Trade Form */}
            <XStack paddingHorizontal={12} gap={8}>
                {/* Order Book skeleton */}
                <YStack flex={143} minWidth={0} flexShrink={0} gap={6}>
                    <SkeletonBlock width="100%" height={28} radius={6} />
                    <SkeletonBlock width="100%" height={14} radius={4} />
                    {Array.from({ length: 7 }, (_, i) => (
                        <SkeletonBlock key={`ask-${i}`} width="100%" height={24} radius={4} />
                    ))}
                    <SkeletonBlock width={80} height={24} radius={6} />
                    {Array.from({ length: 7 }, (_, i) => (
                        <SkeletonBlock key={`bid-${i}`} width="100%" height={24} radius={4} />
                    ))}
                    <SkeletonBlock width="100%" height={24} radius={4} />
                </YStack>

                {/* Trade Form skeleton */}
                <YStack flex={200} minWidth={0} flexShrink={0} gap={6}>
                    <XStack gap={6}>
                        <SkeletonBlock width="60%" height={28} radius={6} />
                        <SkeletonBlock width="35%" height={28} radius={6} />
                    </XStack>
                    <SkeletonBlock width="100%" height={28} radius={6} />
                    <SkeletonBlock width="100%" height={40} radius={6} />
                    <SkeletonBlock width="100%" height={40} radius={6} />
                    <SkeletonBlock width="100%" height={24} radius={6} />
                    <SkeletonBlock width="100%" height={24} radius={6} />
                    <SkeletonBlock width={80} height={14} radius={6} />
                    <SkeletonBlock width={60} height={14} radius={6} />
                    <YStack gap={2}>
                        <SkeletonBlock width="100%" height={24} radius={4} />
                        <SkeletonBlock width="100%" height={24} radius={4} />
                        <SkeletonBlock width="100%" height={36} radius={22} />
                    </YStack>
                    <YStack gap={2}>
                        <SkeletonBlock width="100%" height={24} radius={4} />
                        <SkeletonBlock width="100%" height={24} radius={4} />
                        <SkeletonBlock width="100%" height={36} radius={22} />
                    </YStack>
                </YStack>
            </XStack>

            {/* Positions section skeleton */}
            <YStack paddingHorizontal={12} paddingTop={16} gap={16}>
                <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap={16}>
                        <SkeletonBlock width={100} height={24} radius={8} />
                        <SkeletonBlock width={80} height={24} radius={8} />
                    </XStack>
                    <SkeletonBlock width={24} height={24} radius={12} />
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                    <SkeletonBlock width={120} height={14} radius={6} />
                    <SkeletonBlock width={64} height={28} radius={16} />
                </XStack>

                <SkeletonPositionCard />
                <SkeletonPositionCard />
            </YStack>
        </YStack>
    );
});
