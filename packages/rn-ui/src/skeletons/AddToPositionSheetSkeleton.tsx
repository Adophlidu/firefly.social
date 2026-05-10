import { memo } from 'react';
import { XStack, YStack } from 'tamagui';

function Block({ width, height, radius = 8 }: { width?: number | string; height: number; radius?: number }) {
    return <YStack width={width} height={height} borderRadius={radius} backgroundColor="$bgHover" />;
}

export const AddToPositionSheetSkeleton = memo(function AddToPositionSheetSkeleton() {
    return (
        <YStack gap={16}>
            <YStack gap={12}>
                <Block width={190} height={24} radius={8} />
                <XStack alignItems="center" justifyContent="space-between">
                    <XStack gap={8} alignItems="center">
                        <Block width={30} height={30} radius={15} />
                        <Block width={96} height={18} radius={6} />
                    </XStack>
                    <Block width={88} height={20} radius={6} />
                </XStack>
            </YStack>

            <YStack borderWidth={1} borderColor="$borderSubdued" borderRadius={16} padding={12} gap={12}>
                <XStack alignItems="center" justifyContent="space-between">
                    <Block width={60} height={17} radius={6} />
                    <Block width={128} height={40} radius={8} />
                </XStack>
                <XStack justifyContent="flex-end">
                    <Block width={120} height={17} radius={6} />
                </XStack>
                <XStack alignItems="center" justifyContent="space-between">
                    <Block width={96} height={17} radius={6} />
                    <Block width={86} height={18} radius={6} />
                </XStack>
                <YStack height={1} backgroundColor="$bgHover" />
                <XStack alignItems="center" justifyContent="space-between">
                    <Block width={64} height={17} radius={6} />
                    <Block width={72} height={18} radius={6} />
                </XStack>
            </YStack>

            <XStack gap={16}>
                <Block width="50%" height={48} radius={96} />
                <Block width="50%" height={48} radius={96} />
            </XStack>
        </YStack>
    );
});
