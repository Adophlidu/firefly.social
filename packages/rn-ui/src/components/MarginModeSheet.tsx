import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, useTheme, XStack, YStack } from 'tamagui';

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

function SelectedIcon() {
    const theme = useTheme();
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
                d="M4.2 2.9H15.8C16.52 2.9 17.1 3.48 17.1 4.2V15.8C17.1 16.52 16.52 17.1 15.8 17.1H4.2C3.48 17.1 2.9 16.52 2.9 15.8V4.2C2.9 3.48 3.48 2.9 4.2 2.9Z"
                fill={theme.text!.get()}
            />
            <Path
                d="M6.2 10.1L8.55 12.45L13.8 7.2"
                stroke={theme.bg!.get()}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function UnselectedIcon() {
    const theme = useTheme();
    return (
        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
                d="M4.2 2.9H15.8C16.52 2.9 17.1 3.48 17.1 4.2V15.8C17.1 16.52 16.52 17.1 15.8 17.1H4.2C3.48 17.1 2.9 16.52 2.9 15.8V4.2C2.9 3.48 3.48 2.9 4.2 2.9Z"
                stroke={theme.text!.get()}
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
    title: ReactNode;
    description: ReactNode;
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
                    <Text color="$text" fontSize={16} lineHeight={20} fontWeight={500}>
                        {title}
                    </Text>
                </XStack>
                <Text color="$textSubdued" textAlign="left" fontSize={13} lineHeight={17} fontWeight={500}>
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

    const MODE_OPTIONS = useMemo(
        () =>
            [
                {
                    mode: TradeMarginMode.CROSS,
                    titleId: <Trans id="rn-ui.marginMode.cross.title">Cross</Trans>,
                    descriptionId: (
                        <Trans id="rn-ui.marginMode.cross.description">
                            All cross positions share the same cross margin as collateral. In the event of liquidation,
                            your cross margin balance and any remaining open positions under assets in this mode may be
                            forfeited.
                        </Trans>
                    ),
                },
                {
                    mode: TradeMarginMode.ISOLATED,
                    titleId: <Trans id="rn-ui.marginMode.isolated.title">Isolated</Trans>,
                    descriptionId: (
                        <Trans id="rn-ui.marginMode.isolated.description">
                            Manage your risk on individual positions by restricting the amount of margin allocated to
                            each. lf the margin ratio of an isolated position reaches 100%, the position will be
                            liquidated. Margin can be added or removed to individual positions in this mode.
                        </Trans>
                    ),
                },
            ] as const,
        [],
    );

    useEffect(() => {
        setSelectedMode(mode);
    }, [mode, open]);

    const handleChange = useCallback(() => {
        if (loading) return;

        onConfirm?.(selectedMode);
    }, [loading, selectedMode, onConfirm]);

    const options = useMemo(
        () => (disableCross ? MODE_OPTIONS.filter((option) => option.mode !== TradeMarginMode.CROSS) : MODE_OPTIONS),
        [disableCross, MODE_OPTIONS],
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
                backgroundColor="$text"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="$bgHover"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                shadowColor="$text"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
            >
                <SheetDragHandle />

                <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                    <Trans id="rn-ui.marginMode.title">Margin Mode</Trans>
                </Text>

                <YStack gap={12}>
                    {options.map((option) => (
                        <OptionCard
                            key={option.mode}
                            selected={selectedMode === option.mode}
                            title={option.titleId}
                            description={option.descriptionId}
                            onPress={() => setSelectedMode(option.mode)}
                        />
                    ))}
                </YStack>

                <WalletActionButton
                    unstyled
                    loading={loading}
                    height={48}
                    borderRadius={96}
                    backgroundColor="$text"
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.9 }}
                    onPress={handleChange}
                >
                    <Text color="$bgHover" fontSize={16} lineHeight={24} fontWeight={700}>
                        <Trans id="rn-ui.action.confirm">Confirm</Trans>
                    </Text>
                </WalletActionButton>
            </Sheet.Frame>
        </Sheet>
    );
});
