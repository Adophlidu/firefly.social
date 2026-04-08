import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function Block({ width, height, radius = 6 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

export const TpSlSheetSkeleton = memo(function TpSlSheetSkeleton() {
    return (
        <YStack gap={16}>
            <Block width={72} height={24} radius={8} />

            <YStack gap={8}>
                {Array.from({ length: 4 }, (_, i) => (
                    <XStack key={`row-${i}`} alignItems="center" justifyContent="space-between">
                        <Block width={120} height={14} />
                        <Block width={72} height={14} />
                    </XStack>
                ))}
            </YStack>

            <YStack gap={8}>
                <XStack gap={8}>
                    <Block width="50%" height={32} radius={6} />
                    <Block width="50%" height={32} radius={6} />
                </XStack>
                <XStack gap={8}>
                    <Block width="50%" height={32} radius={6} />
                    <Block width="50%" height={32} radius={6} />
                </XStack>
            </YStack>

            <Block width="100%" height={48} radius={96} />
            <YStack alignItems="center" paddingTop={8}>
                <Block width={134} height={5} radius={100} />
            </YStack>
        </YStack>
    );
});
