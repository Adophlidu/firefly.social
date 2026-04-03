import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function SkeletonBlock({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

export const AccountHistorySkeleton = memo(function AccountHistorySkeleton() {
    return (
        <YStack gap={12} paddingBottom={16}>
            {Array.from({ length: 5 }, (_, index) => (
                <XStack
                    key={index}
                    backgroundColor="#FFFFFF"
                    borderWidth={1}
                    borderColor="#F0F0F0"
                    borderRadius={12}
                    padding={12}
                    alignItems="center"
                    gap={8}
                >
                    <SkeletonBlock width={40} height={40} radius={20} />

                    <YStack flex={1} gap={6}>
                        <SkeletonBlock width="34%" height={14} />
                        <SkeletonBlock width="52%" height={12} />
                    </YStack>

                    <SkeletonBlock width={56} height={14} />
                </XStack>
            ))}
        </YStack>
    );
});
