import { memo, useCallback, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Input, Sheet, Text, XStack, YStack } from 'tamagui';

import type { ClosePositionSheetData } from '@/types/ui';

interface ClosePositionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ClosePositionSheetData;
    onConfirm?: (amount: number) => void;
}

function MinusIcon() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M6 12H18" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PlusIcon() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M6 12H18" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12 18V6" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
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

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <XStack height={40} alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
            <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                {label}
            </Text>
            <Text color={valueColor ?? '#171717'} fontSize={14} lineHeight={18} fontWeight={500} textAlign="right">
                {value}
            </Text>
        </XStack>
    );
}

export const ClosePositionSheet = memo<ClosePositionSheetProps>(function ClosePositionSheet({
    open,
    onOpenChange,
    data,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [amountText, setAmountText] = useState('0');

    const amount = Number(amountText) || 0;
    const pnlColor = data.estClosedPnlValue >= 0 ? '#429F37' : '#FF372B';
    const hasAmount = amount > 0;

    const handleAmountChange = useCallback((text: string) => {
        const cleaned = text.replace(/[^0-9.]/g, '');
        setAmountText(cleaned);
    }, []);

    const stepAmount = useCallback((delta: number) => {
        setAmountText((prev) => {
            const next = Math.max(0, (Number(prev) || 0) + delta);
            return String(next);
        });
    }, []);

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
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                {/* Title */}
                <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                    Close Position
                </Text>

                {/* Token row: icon + Current Price + price value */}
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

                {/* Amount stepper */}
                <YStack gap={8}>
                    <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={32}>
                        <Button
                            unstyled
                            width={32}
                            height={32}
                            backgroundColor="#F8F7F9"
                            borderRadius={8}
                            alignItems="center"
                            justifyContent="center"
                            pressStyle={{ opacity: 0.72 }}
                            onPress={() => stepAmount(-1)}
                        >
                            <MinusIcon />
                        </Button>

                        <XStack alignItems="center" justifyContent="center" flex={1}>
                            <Text color="#171717" fontSize={40} lineHeight={40} fontWeight={700}>
                                $
                            </Text>
                            <Input
                                unstyled
                                value={amountText}
                                onChangeText={handleAmountChange}
                                keyboardType="numeric"
                                textAlign="center"
                                color="#171717"
                                fontSize={40}
                                lineHeight={40}
                                fontWeight={700}
                                minWidth={40}
                                maxWidth={180}
                                padding={0}
                            />
                        </XStack>

                        <Button
                            unstyled
                            width={32}
                            height={32}
                            backgroundColor="#F8F7F9"
                            borderRadius={8}
                            alignItems="center"
                            justifyContent="center"
                            pressStyle={{ opacity: 0.72 }}
                            onPress={() => stepAmount(1)}
                        >
                            <PlusIcon />
                        </Button>
                    </XStack>

                    <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} textAlign="center">
                        {data.available} available
                    </Text>
                </YStack>

                {/* Info card */}
                <YStack borderWidth={1} borderColor="rgba(34, 33, 47, 0.15)" borderRadius={16} paddingVertical={12}>
                    <InfoRow label="Leverage" value={data.leverage} />
                    <InfoRow label="Receive" value={data.receive} />
                    <YStack height={1} backgroundColor="rgba(34, 33, 47, 0.08)" />
                    <InfoRow label="Est. Closed PnL" value={data.estClosedPnl} valueColor={pnlColor} />
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
                        backgroundColor={hasAmount ? '#171717' : '#D8D7E1'}
                        borderRadius={96}
                        alignItems="center"
                        justifyContent="center"
                        pressStyle={{ opacity: hasAmount ? 0.9 : 1 }}
                        disabled={!hasAmount}
                        onPress={() => {
                            onConfirm?.(amount);
                            onOpenChange(false);
                        }}
                    >
                        <Text color={hasAmount ? '#FFFFFF' : '#A9A6BC'} fontSize={16} lineHeight={24} fontWeight={700}>
                            Close
                        </Text>
                    </Button>
                </XStack>
            </Sheet.Frame>
        </Sheet>
    );
});
