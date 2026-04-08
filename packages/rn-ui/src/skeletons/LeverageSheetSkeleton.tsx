import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function Block({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="#EDEEF2" />;
}

export const LeverageSheetSkeleton = memo(function LeverageSheetSkeleton() {
    return (
        <YStack gap={16}>
            <Block width={140} height={24} radius={8} />

            <XStack alignItems="center" justifyContent="space-between">
                <Block width={40} height={40} radius={8} />
                <Block width={72} height={40} radius={8} />
                <Block width={40} height={40} radius={8} />
            </XStack>

            <Block width="100%" height={15} radius={100} />

            <YStack gap={8}>
                <Block width="100%" height={17} radius={6} />
                <Block width="100%" height={17} radius={6} />
                <Block width="100%" height={17} radius={6} />
            </YStack>

            <Block width="100%" height={48} radius={96} />
        </YStack>
    );
});
