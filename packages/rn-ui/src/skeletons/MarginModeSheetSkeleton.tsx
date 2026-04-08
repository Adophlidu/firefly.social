import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function Block({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

export const MarginModeSheetSkeleton = memo(function MarginModeSheetSkeleton() {
    return (
        <YStack gap={16}>
            <Block width={120} height={24} radius={8} />

            <YStack gap={8}>
                <YStack gap={8}>
                    <XStack gap={6} alignItems="center">
                        <Block width={20} height={20} radius={4} />
                        <Block width={64} height={20} radius={6} />
                    </XStack>
                    <Block width="100%" height={68} radius={6} />
                </YStack>

                <YStack gap={8}>
                    <XStack gap={6} alignItems="center">
                        <Block width={20} height={20} radius={4} />
                        <Block width={72} height={20} radius={6} />
                    </XStack>
                    <Block width="100%" height={102} radius={6} />
                </YStack>
            </YStack>

            <Block width="100%" height={48} radius={96} />
        </YStack>
    );
});
