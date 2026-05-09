import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Input, Sheet, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { AddToPositionSheetSkeleton } from '@/skeletons/AddToPositionSheetSkeleton';
import type { AddToPositionSheetData } from '@/types/ui';

interface AddToPositionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: AddToPositionSheetData;
    loading?: boolean;
    onConfirm?: (amount: number) => void;
}

function BtcIcon() {
    return (
        <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <Path
                d="M15 30C23.2843 30 30 23.2843 30 15C30 6.71573 23.2843 0 15 0C6.71573 0 0 6.71573 0 15C0 23.2843 6.71573 30 15 30Z"
                fill="#F7931A"
            />
            <Path
                d="M21.6 12.84C21.9 10.92 20.46 9.9 18.48 9.21L19.11 6.69L17.58 6.3L16.96 8.76C16.56 8.66 16.15 8.57 15.74 8.48L16.36 6.01L14.83 5.62L14.2 8.14C13.87 8.06 13.54 7.99 13.22 7.91L11.08 7.38L10.7 9.01C10.7 9.01 11.83 9.27 11.81 9.28C12.43 9.43 12.54 9.85 12.52 10.19L11.81 13.04C11.85 13.05 11.9 13.06 11.96 13.09L11.8 13.05L10.81 17.01C10.73 17.21 10.53 17.51 10.08 17.4C10.09 17.42 8.97 17.13 8.97 17.13L8.25 18.87L10.27 19.37C10.64 19.46 11 19.56 11.35 19.65L10.71 22.2L12.24 22.59L12.87 20.06C13.28 20.17 13.68 20.27 14.07 20.37L13.44 22.88L14.97 23.27L15.61 20.73C18.22 21.22 20.19 21.02 21.03 18.66C21.71 16.76 21 15.66 19.6 14.95C20.62 14.71 21.38 14.04 21.6 12.84ZM18.07 17.61C17.57 19.51 14.35 18.48 13.31 18.22L14.15 14.87C15.19 15.13 18.59 15.62 18.07 17.61ZM18.57 12.81C18.11 14.55 15.42 13.66 14.56 13.45L15.32 10.4C16.18 10.61 19.04 11 18.57 12.81Z"
                fill="white"
            />
        </Svg>
    );
}

function WarningIcon() {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M8 1.33C4.32 1.33 1.33 4.32 1.33 8C1.33 11.68 4.32 14.67 8 14.67C11.68 14.67 14.67 11.68 14.67 8C14.67 4.32 11.68 1.33 8 1.33ZM7.5 5.33C7.5 5.06 7.73 4.83 8 4.83C8.27 4.83 8.5 5.06 8.5 5.33V8.67C8.5 8.94 8.27 9.17 8 9.17C7.73 9.17 7.5 8.94 7.5 8.67V5.33ZM8.61 10.93C8.57 11.04 8.51 11.13 8.44 11.21C8.36 11.28 8.27 11.34 8.17 11.38C8.07 11.42 7.96 11.44 7.85 11.44C7.74 11.44 7.63 11.42 7.53 11.38C7.43 11.34 7.34 11.28 7.26 11.21C7.19 11.13 7.13 11.04 7.09 10.93C7.05 10.83 7.03 10.72 7.03 10.61C7.03 10.5 7.05 10.39 7.09 10.29C7.13 10.19 7.19 10.1 7.26 10.02C7.34 9.95 7.43 9.89 7.53 9.85C7.73 9.77 7.97 9.77 8.17 9.85C8.27 9.89 8.36 9.95 8.44 10.02C8.51 10.1 8.57 10.19 8.61 10.29C8.65 10.39 8.67 10.5 8.67 10.61C8.67 10.72 8.65 10.83 8.61 10.93Z"
                fill="#FF372B"
            />
        </Svg>
    );
}

export const AddToPositionSheet = memo<AddToPositionSheetProps>(function AddToPositionSheet({
    open,
    onOpenChange,
    data,
    loading = false,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [amountText, setAmountText] = useState(data.defaultAmount);

    useEffect(() => {
        setAmountText(data.defaultAmount);
    }, [data.defaultAmount, open]);

    const amount = Number(amountText) || 0;
    const belowMinimum = amount > 0 && amount < data.minimumAmount;
    const isValid = amount >= data.minimumAmount;

    const handleAmountChange = useCallback((text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        setAmountText(cleaned);
    }, []);

    const minimumLabel = useMemo(() => {
        return `Minimum $${data.minimumAmount.toFixed(2)}`;
    }, [data.minimumAmount]);

    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onOpenChange}
            snapPointsMode="fit"
            dismissOnSnapToBottom
            position={position}
            onPositionChange={setPosition}
            zIndex={100_000}
        >
            <Sheet.Overlay
                animation="quick"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                opacity={0.16}
                backgroundColor="#000000"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="rgba(34, 33, 47, 0.03)"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="#403D57"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
            >
                <SheetDragHandle />

                {loading ? <AddToPositionSheetSkeleton /> : null}

                {!loading ? (
                    <>
                        {/* Title */}
                        <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            Add to Position
                        </Text>

                        {/* Token row */}
                        <XStack alignItems="center" gap={8} borderRadius={12}>
                            <BtcIcon />
                            <XStack flex={1} alignItems="center" justifyContent="space-between">
                                <Text color="#171717" fontSize={14} lineHeight={14} fontWeight={600}>
                                    Current Price
                                </Text>
                                <Text color="#171717" fontSize={16} lineHeight={20} fontWeight={600} textAlign="right">
                                    {data.currentPrice}
                                </Text>
                            </XStack>
                        </XStack>

                        {/* Info card */}
                        <YStack
                            borderWidth={1}
                            borderColor="rgba(34, 33, 47, 0.15)"
                            borderRadius={16}
                            paddingVertical={12}
                        >
                            {/* Amount row */}
                            <YStack gap={4} paddingHorizontal={12}>
                                <XStack alignItems="center" justifyContent="space-between">
                                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                        Amount
                                    </Text>
                                    <XStack
                                        borderWidth={1}
                                        borderColor="rgba(34, 33, 47, 0.15)"
                                        borderRadius={8}
                                        height={40}
                                        width={128}
                                        alignItems="center"
                                        justifyContent="flex-end"
                                        paddingHorizontal={8}
                                        paddingVertical={10}
                                    >
                                        <XStack alignItems="center">
                                            <Text color="#171717" fontSize={14} lineHeight={18} fontWeight={500}>
                                                $
                                            </Text>
                                            <Input
                                                unstyled
                                                value={amountText}
                                                onChangeText={handleAmountChange}
                                                keyboardType="numeric"
                                                textAlign="right"
                                                color="#171717"
                                                fontSize={14}
                                                lineHeight={18}
                                                fontWeight={500}
                                                padding={0}
                                                minWidth={20}
                                                maxWidth={100}
                                            />
                                        </XStack>
                                    </XStack>
                                </XStack>

                                {/* Keep warning row height stable to avoid sheet reflow */}
                                <XStack height={17} alignItems="center" justifyContent="flex-end" gap={4}>
                                    {belowMinimum ? <WarningIcon /> : null}
                                    <Text
                                        color="#FF372B"
                                        fontSize={13}
                                        lineHeight={17}
                                        fontWeight={600}
                                        opacity={belowMinimum ? 1 : 0}
                                    >
                                        {minimumLabel}
                                    </Text>
                                </XStack>
                            </YStack>

                            {/* Liquidation Price */}
                            <XStack
                                height={40}
                                alignItems="center"
                                justifyContent="space-between"
                                paddingHorizontal={12}
                            >
                                <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                    Liquidation Price
                                </Text>
                                <Text color="#171717" fontSize={14} lineHeight={18} fontWeight={500} textAlign="right">
                                    {data.liquidationPrice}
                                </Text>
                            </XStack>

                            {/* Divider */}
                            <YStack height={1} backgroundColor="rgba(34, 33, 47, 0.08)" />

                            {/* New Total */}
                            <XStack
                                height={40}
                                alignItems="center"
                                justifyContent="space-between"
                                paddingHorizontal={12}
                            >
                                <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                    New Total
                                </Text>
                                <Text color="#171717" fontSize={14} lineHeight={18} fontWeight={500} textAlign="right">
                                    {data.newTotal}
                                </Text>
                            </XStack>
                        </YStack>

                        {/* Action buttons */}
                        <XStack gap={16}>
                            <Button
                                unstyled
                                flex={1}
                                height={48}
                                borderWidth={1}
                                borderColor="#171717"
                                borderRadius={96}
                                alignItems="center"
                                justifyContent="center"
                                pressStyle={{ opacity: 0.75 }}
                                onPress={() => onOpenChange(false)}
                            >
                                <Text color="#171717" fontSize={14} lineHeight={24} fontWeight={700} textAlign="center">
                                    Cancel
                                </Text>
                            </Button>

                            <Button
                                unstyled
                                flex={1}
                                height={48}
                                backgroundColor={isValid ? '#171717' : '#D8D7E1'}
                                borderRadius={96}
                                alignItems="center"
                                justifyContent="center"
                                pressStyle={{ opacity: isValid ? 0.9 : 1 }}
                                disabled={!isValid}
                                onPress={() => {
                                    onConfirm?.(amount);
                                    onOpenChange(false);
                                }}
                            >
                                <Text
                                    color={isValid ? '#E8E8E8' : '#A9A6BC'}
                                    fontSize={16}
                                    lineHeight={24}
                                    fontWeight={700}
                                >
                                    Add
                                </Text>
                            </Button>
                        </XStack>
                    </>
                ) : null}
            </Sheet.Frame>
        </Sheet>
    );
});
