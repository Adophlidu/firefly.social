import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { WalletActionButton } from '@/components/WalletActionButton';
import { TradeMarginMode } from '@/constants/enum';

interface MarginModeSheetProps {
    open: boolean;
    mode: TradeMarginMode;
    loading?: boolean;
    disableCross?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm?: (mode: TradeMarginMode) => void;
}

const MODE_OPTIONS = [
    {
        mode: TradeMarginMode.CROSS,
        title: 'Cross',
        description:
            'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
    },
    {
        mode: TradeMarginMode.ISOLATED,
        title: 'Isolated',
        description:
            'Manage your risk on individual positions by restricting the amount of margin allocated to each. lf the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
    },
];

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
                <Text color="rgba(70, 70, 70, 0.8)" textAlign="left" fontSize={13} lineHeight={17} fontWeight={500}>
                    {description}
                </Text>
            </YStack>
        </Button>
    );
}

export const MarginModeSheet = memo<MarginModeSheetProps>(function MarginModeSheet({
    open,
    mode,
    loading,
    disableCross,
    onOpenChange,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [selectedMode, setSelectedMode] = useState<TradeMarginMode>(mode);

    useEffect(() => {
        setSelectedMode(mode);
    }, [mode, open]);

    const handleChange = useCallback(() => {
        if (loading) return;

        onConfirm?.(selectedMode);
    }, [loading, selectedMode, onConfirm]);

    const options = useMemo(
        () => (disableCross ? MODE_OPTIONS.filter((option) => option.mode !== TradeMarginMode.CROSS) : MODE_OPTIONS),
        [disableCross],
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
            >
                <SheetDragHandle />

                <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                    Margin Mode
                </Text>

                <YStack gap={12}>
                    {options.map((option) => (
                        <OptionCard
                            key={option.mode}
                            selected={selectedMode === option.mode}
                            title={option.title}
                            description={option.description}
                            onPress={() => setSelectedMode(option.mode)}
                        />
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
