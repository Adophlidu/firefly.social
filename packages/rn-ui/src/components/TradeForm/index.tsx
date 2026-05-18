import { Trans, useLingui } from '@lingui/react/macro';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Text, useTheme, XStack, YStack } from 'tamagui';

import { LeverageSheet } from '@/components/LeverageSheet';
import { MarginModeSheet } from '@/components/MarginModeSheet';
import { OrderTypeSheet } from '@/components/OrderTypeSheet';
import { LimitPriceInput } from '@/components/TradeForm/LimitPriceInput';
import { SizeInput } from '@/components/TradeForm/SizeInput';
import { SizeSlider } from '@/components/TradeForm/SizeSlider';
import { SubmitButtons } from '@/components/TradeForm/SubmitButtons';
import { TpSlSettingsInTradeForm } from '@/components/TradeForm/TpSlSettingsInTradeForm';
import { OrderType, TradeMarginMode } from '@/constants/enum';
import { formatAmount } from '@/helpers/formatAmount';
import { navigate } from '@/helpers/navigate';
import { useChangeLeverage } from '@/hooks/Perps/useChangeLeverage';
import { useChangeMarginMode } from '@/hooks/Perps/useChangeMarginMode';
import { useListenAssetCtx } from '@/hooks/Perps/useListenAssetCtx';
import {
    assetBalanceAtom,
    coinNameAtom,
    leverageAtom,
    leverageSheetOpenAtom,
    marginModeAtom,
    marginModeSheetOpenAtom,
    orderTypeAtom,
    toggleOrderTypeAtom,
} from '@/store/tradeForm';

interface PerpsTradeFormProps {
    marginMode?: 'strictIsolated' | 'noCross';
    maxLeverage?: number;
    coinIndex: number;
}

function ChevronDownIcon({ color }: { color?: string }) {
    const theme = useTheme();
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <Path
                d="M3.1 5.85L6.13 8.87C6.61 9.35 7.4 9.35 7.88 8.87L10.9 5.85"
                stroke={color ?? theme.text!.get()}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function AddCircleIcon() {
    const theme = useTheme();
    const stroke = theme.text!.get();
    return (
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path
                d="M6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11Z"
                stroke={stroke}
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path d="M4 6H8" stroke={stroke} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 8V4" stroke={stroke} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function DropdownButton({ label, flex, onPress }: { label: string; flex?: boolean; onPress?: () => void }) {
    return (
        <Button
            unstyled
            backgroundColor="$bgSubdued"
            borderRadius={6}
            height={28}
            paddingHorizontal={10}
            paddingVertical={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            {...(flex ? { flex: 1 } : {})}
            pressStyle={{ opacity: 0.75 }}
            onPress={onPress}
        >
            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                {label}
            </Text>
            <ChevronDownIcon />
        </Button>
    );
}

export const PerpsTradeForm = memo<PerpsTradeFormProps>(function PerpsTradeForm({
    marginMode,
    maxLeverage = 1,
    coinIndex,
}) {
    const { i18n } = useLingui();
    const [leverageSheetOpen, setLeverageSheetOpen] = useAtom(leverageSheetOpenAtom);
    const [marginModeSheetOpen, setMarginModeSheetOpen] = useAtom(marginModeSheetOpenAtom);
    const [orderTypeSheetOpen, setOrderTypeSheetOpen] = useState(false);

    // Form data
    const isCrossDisabled = marginMode === 'noCross' || marginMode === 'strictIsolated';
    const orderType = useAtomValue(orderTypeAtom);
    const setOrderType = useSetAtom(toggleOrderTypeAtom);
    const [currentMode, setCurrentMode] = useAtom(marginModeAtom);
    const [leverage, setLeverage] = useAtom(leverageAtom);

    const available = useAtomValue(assetBalanceAtom);
    const coinName = useAtomValue(coinNameAtom);

    useListenAssetCtx();
    useEffect(() => {
        if (isCrossDisabled) {
            setCurrentMode(TradeMarginMode.ISOLATED);
        }
    }, [isCrossDisabled, setCurrentMode]);
    useEffect(() => {
        if (maxLeverage && leverage > maxLeverage) {
            setLeverage(maxLeverage);
        }
    }, [maxLeverage, leverage, setLeverage]);

    const [{ loading }, changeLeverage] = useChangeLeverage(coinIndex);
    const [{ loading: isModeLoading }, changeMarginMode] = useChangeMarginMode(coinIndex);

    return (
        <YStack width="100%" gap={16}>
            {/* Form Inputs */}
            <YStack gap={6}>
                {/* Cross / Leverage */}
                <XStack gap={6} alignItems="center">
                    <DropdownButton
                        label={
                            currentMode === TradeMarginMode.CROSS
                                ? i18n._('rn-ui.marginMode.cross.title')
                                : i18n._('rn-ui.marginMode.isolated.title')
                        }
                        flex
                        onPress={() => setMarginModeSheetOpen(true)}
                    />
                    <DropdownButton label={`${leverage}x`} onPress={() => setLeverageSheetOpen(true)} />
                </XStack>

                {/* Order Type */}
                <DropdownButton
                    label={
                        orderType === OrderType.MARKET
                            ? i18n._('rn-ui.orderType.market')
                            : i18n._('rn-ui.orderType.limit')
                    }
                    flex
                    onPress={() => setOrderTypeSheetOpen(true)}
                />

                {/* Price Input */}
                <LimitPriceInput />

                {/* Amount Input */}
                <SizeInput />

                {/* Slider */}
                <SizeSlider />

                {/* Available */}
                <Button unstyled onPress={() => navigate('addFunds', {})}>
                    <XStack height={24} alignItems="center" justifyContent="space-between">
                        <Text color="$textDisabled" fontSize={12} lineHeight={14} fontWeight={500}>
                            <Trans id="rn-ui.trade-form.available">Available</Trans>
                        </Text>
                        <XStack alignItems="center" justifyContent="flex-end" gap={4}>
                            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                                {`$${formatAmount(available || '0')}`}
                            </Text>
                            <AddCircleIcon />
                        </XStack>
                    </XStack>
                </Button>
            </YStack>

            {/* Checkboxes + Estimates + Buttons */}
            <YStack>
                <YStack gap={4}>
                    <YStack gap={6}>
                        <TpSlSettingsInTradeForm />

                        <SubmitButtons maxLeverage={maxLeverage} />
                    </YStack>
                </YStack>
            </YStack>

            <MarginModeSheet
                disableCross={isCrossDisabled}
                open={marginModeSheetOpen}
                mode={currentMode}
                loading={isModeLoading}
                onOpenChange={setMarginModeSheetOpen}
                onConfirm={changeMarginMode}
            />

            <LeverageSheet
                coinName={coinName}
                open={leverageSheetOpen}
                current={leverage}
                max={maxLeverage}
                loading={loading}
                onOpenChange={setLeverageSheetOpen}
                onConfirm={changeLeverage}
            />

            <OrderTypeSheet
                open={orderTypeSheetOpen}
                orderType={orderType}
                onOpenChange={setOrderTypeSheetOpen}
                onConfirm={setOrderType}
            />
        </YStack>
    );
});
