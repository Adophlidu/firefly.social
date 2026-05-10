import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function Block({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="$bgHover" />;
}

export const AccountAmountSheetSkeleton = memo(function AccountAmountSheetSkeleton() {
    return (
        <YStack width="100%" gap={24}>
            <XStack alignItems="center" justifyContent="space-between" gap={12}>
                <Block width={140} height={24} radius={8} />
                <Block width={24} height={24} radius={12} />
            </XStack>

            <YStack alignItems="center" gap={6}>
                <Block width={220} height={56} radius={12} />
                <Block width={140} height={17} radius={8} />
            </YStack>

            <XStack alignItems="center" gap={16}>
                <Block width="100%" height={44} radius={22} />
                <Block width="100%" height={44} radius={22} />
            </XStack>
        </YStack>
    );
});
