import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

export const PerpsDetailSkeleton = memo(function PerpsDetailSkeleton() {
    return (
        <YStack backgroundColor="#FFFFFF" height="100%" minHeight={0}>
            <XStack height={44} alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
                <SkeletonBlock width={24} height={24} radius={12} />
                <SkeletonBlock width={158} height={24} radius={10} />
                <SkeletonBlock width={24} height={24} radius={12} />
            </XStack>

            <YStack flex={1} minHeight={0} paddingHorizontal={12} paddingTop={8} gap={14}>
                <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack gap={6}>
                        <SkeletonBlock width={64} height={12} radius={6} />
                        <SkeletonBlock width={140} height={42} radius={10} />
                        <SkeletonBlock width={96} height={12} radius={6} />
                        <SkeletonBlock width={110} height={12} radius={6} />
                    </YStack>

                    <YStack width={160} gap={8}>
                        <SkeletonBlock width="100%" height={12} radius={6} />
                        <SkeletonBlock width="100%" height={12} radius={6} />
                        <SkeletonBlock width="100%" height={12} radius={6} />
                    </YStack>
                </XStack>

                <SkeletonBlock width="100%" height={320} radius={10} />

                <YStack gap={6}>
                    <SkeletonBlock width="100%" height={26} radius={12} />
                    {Array.from({ length: 8 }, (_, index) => (
                        <SkeletonBlock key={index} width="100%" height={22} radius={6} />
                    ))}
                </YStack>
            </YStack>

            <XStack paddingHorizontal={12} paddingTop={10} paddingBottom={14} gap={8}>
                <SkeletonBlock width="100%" height={54} radius={27} />
                <SkeletonBlock width="100%" height={54} radius={27} />
            </XStack>
        </YStack>
    );
});
