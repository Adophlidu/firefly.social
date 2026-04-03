import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

interface PerpsMarketSkeletonProps {
    mode?: 'full' | 'list';
    rows?: number;
}

function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <YStack gap={8} paddingTop={4}>
            {Array.from({ length: rows }, (_, index) => (
                <XStack key={index} gap={12} alignItems="center" paddingVertical={12}>
                    <SkeletonBlock width={36} height={36} radius={18} />

                    <YStack flex={1} gap={6}>
                        <XStack gap={4} alignItems="center">
                            <SkeletonBlock width={34} height={14} radius={6} />
                            <SkeletonBlock width={32} height={16} radius={999} />
                        </XStack>
                        <SkeletonBlock width={58} height={12} radius={6} />
                    </YStack>

                    <YStack alignItems="flex-end" gap={6} minWidth={96}>
                        <SkeletonBlock width={70} height={14} radius={6} />
                        <SkeletonBlock width={42} height={12} radius={6} />
                    </YStack>
                </XStack>
            ))}
        </YStack>
    );
}

export const PerpsMarketSkeleton = memo<PerpsMarketSkeletonProps>(function PerpsMarketSkeleton({
    mode = 'full',
    rows = 4,
}) {
    if (mode === 'list') {
        return <ListRowsSkeleton rows={rows} />;
    }

    return (
        <YStack gap={12} paddingHorizontal={16} paddingTop={10} paddingBottom={28}>
            <YStack alignItems="center" gap={8} paddingBottom={4}>
                <SkeletonBlock width={36} height={5} radius={999} />
                <SkeletonBlock width={64} height={24} radius={10} />
            </YStack>

            <SkeletonBlock width="100%" height={36} radius={18} />

            <XStack gap={16} paddingTop={2}>
                <SkeletonBlock width={62} height={24} radius={6} />
                <SkeletonBlock width={54} height={24} radius={6} />
                <SkeletonBlock width={52} height={24} radius={6} />
                <SkeletonBlock width={72} height={24} radius={6} />
            </XStack>

            <SkeletonBlock width={82} height={30} radius={16} />

            <ListRowsSkeleton rows={rows} />
        </YStack>
    );
});
