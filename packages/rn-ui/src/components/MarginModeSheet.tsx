import { memo, useEffect, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { MarginModeSheetSkeleton } from '@/skeletons/MarginModeSheetSkeleton';
import { type MarginModeSheetData, type PerpsTradeMarginMode } from '@/types/ui';

interface MarginModeSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: MarginModeSheetData;
    loading?: boolean;
    onConfirm?: (mode: PerpsTradeMarginMode) => void;
}

function SelectedIcon() {
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
                d="M4.2 2.9H15.8C16.52 2.9 17.1 3.48 17.1 4.2V15.8C17.1 16.52 16.52 17.1 15.8 17.1H4.2C3.48 17.1 2.9 16.52 2.9 15.8V4.2C2.9 3.48 3.48 2.9 4.2 2.9Z"
                fill="#171717"
            />
            <Path
                d="M6.2 10.1L8.55 12.45L13.8 7.2"
                stroke="#FFFFFF"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function UnselectedIcon() {
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
                d="M4.2 2.9H15.8C16.52 2.9 17.1 3.48 17.1 4.2V15.8C17.1 16.52 16.52 17.1 15.8 17.1H4.2C3.48 17.1 2.9 16.52 2.9 15.8V4.2C2.9 3.48 3.48 2.9 4.2 2.9Z"
                stroke="#171717"
                strokeWidth="1.2"
            />
        </Svg>
    );
}

function OptionCard({
    selected,
    title,
    description,
    onPress,
}: {
    selected: boolean;
    title: string;
    description: string;
    onPress: () => void;
}) {
    return (
        <Button
            unstyled
            width="100%"
            alignItems="flex-start"
            justifyContent="flex-start"
            padding={0}
            pressStyle={{ opacity: 0.78 }}
            onPress={onPress}
        >
            <YStack gap={8} width="100%">
                <XStack gap={6} alignItems="center">
                    {selected ? <SelectedIcon /> : <UnselectedIcon />}
                    <Text color="#171717" fontSize={16} lineHeight={20} fontWeight={500}>
                        {title}
                    </Text>
                </XStack>
                <Text color="rgba(70, 70, 70, 0.8)" fontSize={13} lineHeight={17} fontWeight={500}>
                    {description}
                </Text>
            </YStack>
        </Button>
    );
}

export const MarginModeSheet = memo<MarginModeSheetProps>(function MarginModeSheet({
    open,
    onOpenChange,
    data,
    loading = false,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [selectedMode, setSelectedMode] = useState<PerpsTradeMarginMode>(data.currentMode);

    useEffect(() => {
        setSelectedMode(data.currentMode);
    }, [data.currentMode, open]);

    const selectedOption = useMemo(
        () => data.options.find((option) => option.mode === selectedMode) ?? data.options[0],
        [data.options, selectedMode],
    );

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
                shadowColor="#403D57"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
                minHeight={410}
            >
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                {loading ? (
                    <MarginModeSheetSkeleton />
                ) : (
                    <>
                        <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            Margin Mode
                        </Text>

                        <YStack gap={12}>
                            {data.options.map((option) => (
                                <OptionCard
                                    key={option.mode}
                                    selected={selectedMode === option.mode}
                                    title={option.title}
                                    description={option.description}
                                    onPress={() => setSelectedMode(option.mode)}
                                />
                            ))}
                        </YStack>

                        <Button
                            unstyled
                            height={48}
                            borderRadius={96}
                            backgroundColor="#171717"
                            alignItems="center"
                            justifyContent="center"
                            pressStyle={{ opacity: 0.9 }}
                            onPress={() => {
                                onConfirm?.(selectedOption?.mode ?? selectedMode);
                                onOpenChange(false);
                            }}
                        >
                            <Text color="#E8E8E8" fontSize={16} lineHeight={24} fontWeight={700}>
                                Confirm
                            </Text>
                        </Button>
                    </>
                )}
            </Sheet.Frame>
        </Sheet>
    );
});
