import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Input, Slider, Text, XStack, YStack } from 'tamagui';

import { LeverageSheet } from '@/components/LeverageSheet';
import { MarginModeSheet } from '@/components/MarginModeSheet';
import { OrderTypeSheet } from '@/components/OrderTypeSheet';
import { loadLeverageSheet, submitLeverageChange } from '@/services/leverage';
import { loadMarginModeSheet, submitMarginModeChange } from '@/services/marginMode';
import { loadOrderTypeSheet, submitOrderTypeChange } from '@/services/orderType';
import {
    type FetchLeverageSheet,
    type FetchMarginModeSheet,
    type FetchOrderTypeSheet,
    type SubmitLeverageChange,
    type SubmitMarginModeChange,
    type SubmitOrderTypeChange,
} from '@/types/services';
import {
    type LeverageSheetData,
    type MarginModeSheetData,
    type OrderTypeSheetData,
    type PerpsTradeFormState,
    type PerpsTradeMarginMode,
    type PerpsTradeOrderType,
} from '@/types/ui';

interface PerpsTradeFormProps {
    market: string;
    tradeForm: PerpsTradeFormState;
    fetchLeverageSheet?: FetchLeverageSheet;
    submitLeverage?: SubmitLeverageChange;
    fetchMarginModeSheet?: FetchMarginModeSheet;
    submitMarginMode?: SubmitMarginModeChange;
    fetchOrderTypeSheet?: FetchOrderTypeSheet;
    submitOrderType?: SubmitOrderTypeChange;
    onTradeFormChange?: (patch: Partial<Pick<PerpsTradeFormState, 'marginMode' | 'leverage' | 'orderType'>>) => void;
}

const defaultLeverageData: LeverageSheetData = {
    symbol: 'BTC',
    currentLeverage: 10,
    minLeverage: 1,
    maxLeverage: 40,
    step: 1,
    notes: [
        'Control the leverage used for BTC positions. The maximum leverage is 40x.',
        'Maximum position at current leverage: 150,000,000 USDC.',
        'Max position size decreases the higher your leverage.',
    ],
};

const defaultMarginModeData: MarginModeSheetData = {
    currentMode: 'cross',
    options: [
        {
            mode: 'cross',
            title: 'Cross',
            description:
                'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
        },
        {
            mode: 'isolated',
            title: 'Isolated',
            description:
                'Manage your risk on individual positions by restricting the amount of margin allocated to each. lf the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
        },
    ],
};

const defaultOrderTypeData: OrderTypeSheetData = {
    currentType: 'market',
    options: [
        { value: 'market', label: 'Market' },
        { value: 'limit', label: 'Limit' },
    ],
};

function ChevronDownIcon({ color = '#171717' }: { color?: string }) {
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <Path
                d="M3.1 5.85L6.13 8.87C6.61 9.35 7.4 9.35 7.88 8.87L10.9 5.85"
                stroke={color}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function CheckboxChecked() {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M1.33 4.93C1.33 2.73 2.73 1.33 4.93 1.33H11.06C13.27 1.33 14.67 2.73 14.67 4.93V11.07C14.67 13.27 13.27 14.67 11.07 14.67H4.93C2.73 14.67 1.33 13.27 1.33 11.07V4.93Z"
                fill="#171717"
            />
            <Path
                d="M5.16 8L7.15 9.99L10.84 6.01"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function CheckboxUnchecked() {
    return (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <Path
                d="M1.33 4.93C1.33 2.73 2.73 1.33 4.93 1.33H11.06C13.27 1.33 14.67 2.73 14.67 4.93V11.07C14.67 13.27 13.27 14.67 11.07 14.67H4.93C2.73 14.67 1.33 13.27 1.33 11.07V4.93Z"
                stroke="#CCCCCC"
                strokeWidth="1.5"
            />
        </Svg>
    );
}

function AddCircleIcon() {
    return (
        <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path
                d="M6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11Z"
                stroke="#171717"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path d="M4 6H8" stroke="#171717" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 8V4" stroke="#171717" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function CurrencyIcon() {
    return (
        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <Path
                d="M5.25 1.17V12.83"
                stroke="rgba(70,70,70,0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M8.75 1.17V12.83"
                stroke="rgba(70,70,70,0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M1.17 5.25H12.83"
                stroke="rgba(70,70,70,0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M1.17 8.75H12.83"
                stroke="rgba(70,70,70,0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function DropdownButton({ label, flex, onPress }: { label: string; flex?: boolean; onPress?: () => void }) {
    return (
        <Button
            unstyled
            backgroundColor="#F8F7F9"
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
            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                {label}
            </Text>
            <ChevronDownIcon />
        </Button>
    );
}

export const PerpsTradeForm = memo<PerpsTradeFormProps>(function PerpsTradeForm({
    market,
    tradeForm,
    fetchLeverageSheet,
    submitLeverage,
    fetchMarginModeSheet,
    submitMarginMode,
    fetchOrderTypeSheet,
    submitOrderType,
    onTradeFormChange,
}) {
    const [sliderVal, setSliderVal] = useState([tradeForm.sliderValue * 100]);
    const [tpSlEnabled, setTpSlEnabled] = useState(tradeForm.tpSlEnabled);
    const [limitPrice, setLimitPrice] = useState('');
    const [tpPrice, setTpPrice] = useState('');
    const [slPrice, setSlPrice] = useState('');
    const [leverageSheetOpen, setLeverageSheetOpen] = useState(false);
    const [leverageSheetLoading, setLeverageSheetLoading] = useState(false);
    const [leverageSheetData, setLeverageSheetData] = useState<LeverageSheetData>(defaultLeverageData);
    const [marginModeSheetOpen, setMarginModeSheetOpen] = useState(false);
    const [marginModeSheetLoading, setMarginModeSheetLoading] = useState(false);
    const [marginModeSheetData, setMarginModeSheetData] = useState<MarginModeSheetData>(defaultMarginModeData);
    const [orderTypeSheetOpen, setOrderTypeSheetOpen] = useState(false);
    const [orderTypeSheetLoading, setOrderTypeSheetLoading] = useState(false);
    const [orderTypeSheetData, setOrderTypeSheetData] = useState<OrderTypeSheetData>(defaultOrderTypeData);

    const loadLeverage = useMemo(() => {
        return fetchLeverageSheet ?? loadLeverageSheet;
    }, [fetchLeverageSheet]);

    const submitLeverageHandler = useMemo(() => {
        return submitLeverage ?? submitLeverageChange;
    }, [submitLeverage]);

    const loadMarginMode = useMemo(() => {
        return fetchMarginModeSheet ?? loadMarginModeSheet;
    }, [fetchMarginModeSheet]);

    const submitMarginModeHandler = useMemo(() => {
        return submitMarginMode ?? submitMarginModeChange;
    }, [submitMarginMode]);

    const loadOrderType = useMemo(() => {
        return fetchOrderTypeSheet ?? loadOrderTypeSheet;
    }, [fetchOrderTypeSheet]);

    const submitOrderTypeHandler = useMemo(() => {
        return submitOrderType ?? submitOrderTypeChange;
    }, [submitOrderType]);

    const isLimitOrder = tradeForm.orderType === 'limit';

    const inputBorderColor = useMemo(() => {
        if (isLimitOrder) {
            return 'rgba(34, 33, 47, 0.15)';
        }
        return 'rgba(34, 33, 47, 0.03)';
    }, [isLimitOrder]);

    useEffect(() => {
        setTpSlEnabled(tradeForm.tpSlEnabled);
    }, [tradeForm.tpSlEnabled]);

    useEffect(() => {
        if (!isLimitOrder) {
            setLimitPrice('');
        }
    }, [isLimitOrder]);

    const handleOpenLeverage = useCallback(async () => {
        setLeverageSheetOpen(true);
        setLeverageSheetLoading(true);

        try {
            const response = await loadLeverage({
                market,
                currentLeverage: Number.parseInt(tradeForm.leverage, 10) || 10,
            });
            setLeverageSheetData(response.data);
        } finally {
            setLeverageSheetLoading(false);
        }
    }, [loadLeverage, market, tradeForm.leverage]);

    const handleOpenMarginMode = useCallback(async () => {
        setMarginModeSheetOpen(true);
        setMarginModeSheetLoading(true);

        try {
            const response = await loadMarginMode({
                market,
                currentMode: tradeForm.marginMode,
            });
            setMarginModeSheetData(response.data);
        } finally {
            setMarginModeSheetLoading(false);
        }
    }, [loadMarginMode, market, tradeForm.marginMode]);

    const handleOpenOrderType = useCallback(async () => {
        setOrderTypeSheetOpen(true);
        setOrderTypeSheetLoading(true);

        try {
            const response = await loadOrderType({
                market,
                currentType: tradeForm.orderType,
            });
            setOrderTypeSheetData(response.data);
        } finally {
            setOrderTypeSheetLoading(false);
        }
    }, [loadOrderType, market, tradeForm.orderType]);

    const handleConfirmMarginMode = useCallback(
        async (mode: PerpsTradeMarginMode) => {
            const response = await submitMarginModeHandler({ market, mode });
            onTradeFormChange?.({ marginMode: response.mode });
        },
        [market, onTradeFormChange, submitMarginModeHandler],
    );

    const handleConfirmLeverage = useCallback(
        async (leverage: number) => {
            const response = await submitLeverageHandler({ market, leverage });
            onTradeFormChange?.({ leverage: `${response.leverage}x` });
        },
        [market, onTradeFormChange, submitLeverageHandler],
    );

    const handleConfirmOrderType = useCallback(
        async (orderType: PerpsTradeOrderType) => {
            const response = await submitOrderTypeHandler({ market, orderType });
            onTradeFormChange?.({ orderType: response.orderType });
        },
        [market, onTradeFormChange, submitOrderTypeHandler],
    );

    return (
        <YStack width="100%" gap={16}>
            {/* Form Inputs */}
            <YStack gap={6}>
                {/* Cross / Leverage */}
                <XStack gap={6} alignItems="center">
                    <DropdownButton
                        label={tradeForm.marginMode === 'cross' ? 'Cross' : 'Isolated'}
                        flex
                        onPress={handleOpenMarginMode}
                    />
                    <DropdownButton label={tradeForm.leverage} onPress={handleOpenLeverage} />
                </XStack>

                {/* Order Type */}
                <DropdownButton
                    label={tradeForm.orderType === 'market' ? 'Market' : 'Limit'}
                    flex
                    onPress={handleOpenOrderType}
                />

                {/* Price Input */}
                <XStack
                    backgroundColor="#F8F7F9"
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={inputBorderColor}
                    height={40}
                    alignItems="center"
                    justifyContent="center"
                    paddingHorizontal={8}
                    paddingVertical={5}
                >
                    <Input
                        unstyled
                        value={limitPrice}
                        onChangeText={setLimitPrice}
                        editable={isLimitOrder}
                        keyboardType="numeric"
                        width="100%"
                        color={isLimitOrder ? '#171717' : 'rgba(70, 70, 70, 0.4)'}
                        fontSize={14}
                        lineHeight={18}
                        fontWeight={500}
                        textAlign="center"
                        placeholder={isLimitOrder ? 'Input Price' : 'Market Price'}
                        placeholderTextColor="rgba(70, 70, 70, 0.4)"
                    />
                </XStack>

                {/* Amount Input */}
                <XStack
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.15)"
                    height={40}
                    alignItems="center"
                    paddingHorizontal={8}
                    paddingVertical={5}
                    gap={4}
                >
                    <Text flex={1} color="#171717" fontSize={14} lineHeight={18} fontWeight={500}>
                        {tradeForm.amount}
                    </Text>
                    <XStack alignItems="center" justifyContent="flex-end" gap={4}>
                        <Text color="rgba(70, 70, 70, 0.8)" fontSize={12} lineHeight={14} fontWeight={500}>
                            USDC
                        </Text>
                        <CurrencyIcon />
                    </XStack>
                </XStack>

                {/* Slider */}
                <YStack height={24} paddingHorizontal={2} paddingVertical={6} justifyContent="center">
                    <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} size="$1">
                        <Slider.Track backgroundColor="#EFEFF3" height={2}>
                            <Slider.TrackActive backgroundColor="#171717" />
                        </Slider.Track>
                        <Slider.Thumb
                            index={0}
                            circular
                            size={14}
                            backgroundColor="#171717"
                            borderWidth={2}
                            borderColor="#FFFFFF"
                        />
                    </Slider>
                </YStack>

                {/* Available */}
                <XStack height={24} alignItems="center" justifyContent="space-between">
                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                        Available
                    </Text>
                    <XStack alignItems="center" justifyContent="flex-end" gap={4}>
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            {tradeForm.available}
                        </Text>
                        <AddCircleIcon />
                    </XStack>
                </XStack>
            </YStack>

            {/* Checkboxes + Estimates + Buttons */}
            <YStack>
                <YStack gap={4}>
                    {/* Reduce Only */}
                    <XStack height={24} alignItems="center" gap={6}>
                        {tradeForm.reduceOnly ? <CheckboxChecked /> : <CheckboxUnchecked />}
                        <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                            Reduce Only
                        </Text>
                    </XStack>

                    {/* TP / SL */}
                    <YStack gap={6}>
                        <XStack height={24} alignItems="center" gap={6}>
                            <Button
                                unstyled
                                onPress={() => setTpSlEnabled((prev) => !prev)}
                                pressStyle={{ opacity: 0.75 }}
                            >
                                {tpSlEnabled ? <CheckboxChecked /> : <CheckboxUnchecked />}
                            </Button>
                            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                TP / SL
                            </Text>
                        </XStack>

                        <XStack gap={6}>
                            <XStack
                                flex={1}
                                height={32}
                                borderRadius={6}
                                borderWidth={1}
                                borderColor={tpSlEnabled ? 'rgba(34, 33, 47, 0.15)' : 'rgba(34, 33, 47, 0.06)'}
                                backgroundColor={tpSlEnabled ? '#FFFFFF' : '#F8F7F9'}
                                alignItems="center"
                                paddingHorizontal={8}
                            >
                                <Input
                                    unstyled
                                    value={tpPrice}
                                    onChangeText={setTpPrice}
                                    editable={tpSlEnabled}
                                    keyboardType="numeric"
                                    width="100%"
                                    color={tpSlEnabled ? '#171717' : 'rgba(70, 70, 70, 0.4)'}
                                    fontSize={12}
                                    lineHeight={14}
                                    fontWeight={500}
                                    placeholder="TP"
                                    placeholderTextColor="rgba(70, 70, 70, 0.4)"
                                />
                            </XStack>
                            <XStack
                                flex={1}
                                height={32}
                                borderRadius={6}
                                borderWidth={1}
                                borderColor={tpSlEnabled ? 'rgba(34, 33, 47, 0.15)' : 'rgba(34, 33, 47, 0.06)'}
                                backgroundColor={tpSlEnabled ? '#FFFFFF' : '#F8F7F9'}
                                alignItems="center"
                                paddingHorizontal={8}
                            >
                                <Input
                                    unstyled
                                    value={slPrice}
                                    onChangeText={setSlPrice}
                                    editable={tpSlEnabled}
                                    keyboardType="numeric"
                                    width="100%"
                                    color={tpSlEnabled ? '#171717' : 'rgba(70, 70, 70, 0.4)'}
                                    fontSize={12}
                                    lineHeight={14}
                                    fontWeight={500}
                                    placeholder="SL"
                                    placeholderTextColor="rgba(70, 70, 70, 0.4)"
                                />
                            </XStack>
                        </XStack>

                        {/* Buy/Long Section */}
                        <YStack gap={2}>
                            <YStack>
                                <XStack height={24} alignItems="center" justifyContent="space-between">
                                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                        Est. Liq. price
                                    </Text>
                                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                        {tradeForm.buy.estLiqPrice}
                                    </Text>
                                </XStack>
                                <XStack height={24} alignItems="center" justifyContent="space-between">
                                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                        Cost
                                    </Text>
                                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                        {tradeForm.buy.cost}
                                    </Text>
                                </XStack>
                            </YStack>
                            <Button
                                unstyled
                                backgroundColor="#429F37"
                                borderRadius={22}
                                height={36}
                                alignItems="center"
                                justifyContent="center"
                                width="100%"
                                pressStyle={{ opacity: 0.9 }}
                            >
                                <Text color="#FFFFFF" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                                    Buy/Long
                                </Text>
                            </Button>
                        </YStack>

                        {/* Sell/Short Section */}
                        <YStack gap={2}>
                            <YStack>
                                <XStack height={24} alignItems="center" justifyContent="space-between">
                                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                        Est. Liq. price
                                    </Text>
                                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                        {tradeForm.sell.estLiqPrice}
                                    </Text>
                                </XStack>
                                <XStack height={24} alignItems="center" justifyContent="space-between">
                                    <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                                        Cost
                                    </Text>
                                    <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
                                        {tradeForm.sell.cost}
                                    </Text>
                                </XStack>
                            </YStack>
                            <Button
                                unstyled
                                backgroundColor="#FF372B"
                                borderRadius={22}
                                height={36}
                                alignItems="center"
                                justifyContent="center"
                                width="100%"
                                pressStyle={{ opacity: 0.9 }}
                            >
                                <Text color="#FFFFFF" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                                    Sell/Short
                                </Text>
                            </Button>
                        </YStack>
                    </YStack>
                </YStack>
            </YStack>

            <MarginModeSheet
                open={marginModeSheetOpen}
                onOpenChange={setMarginModeSheetOpen}
                data={marginModeSheetData}
                loading={marginModeSheetLoading}
                onConfirm={handleConfirmMarginMode}
            />

            <LeverageSheet
                open={leverageSheetOpen}
                onOpenChange={setLeverageSheetOpen}
                data={leverageSheetData}
                loading={leverageSheetLoading}
                onConfirm={handleConfirmLeverage}
            />

            <OrderTypeSheet
                open={orderTypeSheetOpen}
                onOpenChange={setOrderTypeSheetOpen}
                data={orderTypeSheetData}
                loading={orderTypeSheetLoading}
                onConfirm={handleConfirmOrderType}
            />
        </YStack>
    );
});
