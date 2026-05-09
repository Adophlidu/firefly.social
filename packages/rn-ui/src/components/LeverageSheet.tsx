import { memo, type ReactNode, useCallback, useEffect, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Slider, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { WalletActionButton } from '@/components/WalletActionButton';

interface LeverageSheetProps {
    open: boolean;
    current: number;
    coinName: string;
    max: number;
    min?: number;
    step?: number;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm?: (leverage: number) => void;
}

function MinusIcon() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M6 12H18"
                stroke="rgba(70, 70, 70, 0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function PlusIcon() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M6 12H18"
                stroke="rgba(70, 70, 70, 0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M12 18V6"
                stroke="rgba(70, 70, 70, 0.8)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function ControlButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
    return (
        <Button
            unstyled
            width={40}
            height={40}
            backgroundColor="#F8F7F9"
            borderRadius={8}
            alignItems="center"
            justifyContent="center"
            pressStyle={{ opacity: 0.75 }}
            onPress={onPress}
        >
            {children}
        </Button>
    );
}

function getNodes(name: string, maxLeverage: number) {
    return [
        `Control the leverage used for ${name} positions. The maximum leverage is ${maxLeverage}x.`,
        // 'Maximum position at current leverage: 150,000,000 USDC.',
        'Max position size decreases the higher your leverage.',
    ];
}

export const LeverageSheet = memo<LeverageSheetProps>(function LeverageSheet({
    open,
    max,
    current,
    min = 1,
    step = 1,
    coinName,
    loading,
    onOpenChange,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [leverage, setLeverage] = useState(current);

    useEffect(() => {
        setLeverage(current);
    }, [current, open]);

    const handleChange = useCallback(() => {
        if (loading) return;

        onConfirm?.(leverage);
    }, [loading, leverage, onConfirm]);

    const clamp = (value: number) => Math.min(max, Math.max(min, value));

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
                minHeight={349}
            >
                <SheetDragHandle />

                <YStack width="100%">
                    <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                        <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            Adjust Leverage
                        </Text>
                        <YStack width={24} height={24} />
                    </XStack>
                </YStack>

                <YStack gap={8}>
                    <XStack alignItems="center" justifyContent="space-between">
                        <ControlButton onPress={() => setLeverage((value) => clamp(value - step))}>
                            <MinusIcon />
                        </ControlButton>
                        <Text
                            color="#171717"
                            fontSize={32}
                            lineHeight={40}
                            fontWeight={600}
                            fontFamily="$body"
                            textAlign="center"
                        >
                            {leverage}x
                        </Text>
                        <ControlButton onPress={() => setLeverage((value) => clamp(value + step))}>
                            <PlusIcon />
                        </ControlButton>
                    </XStack>

                    <YStack height={15} paddingTop={5} paddingBottom={24} justifyContent="center">
                        <Slider
                            value={[leverage]}
                            onValueChange={([next]) => setLeverage(clamp(Math.round(next)))}
                            min={min}
                            max={max}
                            step={step}
                            size="$1"
                        >
                            <Slider.Track backgroundColor="#5E69FF" height={4} opacity={0.2}>
                                <Slider.TrackActive backgroundColor="#5E69FF" />
                            </Slider.Track>
                            <Slider.Thumb
                                index={0}
                                circular
                                size={12}
                                backgroundColor="#5E69FF"
                                borderWidth={2}
                                borderColor="#FFFFFF"
                                shadowColor="#5E69FF"
                                shadowOpacity={0.36}
                                shadowRadius={4}
                                shadowOffset={{ width: 0, height: 2 }}
                            />
                        </Slider>
                    </YStack>
                </YStack>

                <YStack gap={4}>
                    {getNodes(coinName, max).map((note) => (
                        <XStack key={note} alignItems="flex-start" gap={6}>
                            <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                •
                            </Text>
                            <Text flex={1} color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                                {note}
                            </Text>
                        </XStack>
                    ))}
                </YStack>

                <WalletActionButton
                    unstyled
                    loading={loading}
                    height={48}
                    borderRadius={96}
                    backgroundColor="#171717"
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.9 }}
                    onPress={handleChange}
                >
                    <Text color="#E8E8E8" fontSize={16} lineHeight={24} fontWeight={700}>
                        Confirm
                    </Text>
                </WalletActionButton>
            </Sheet.Frame>
        </Sheet>
    );
});
