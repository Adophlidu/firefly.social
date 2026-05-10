import { memo, useCallback, useEffect, useState } from 'react';
import { Input, Sheet, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { WalletActionButton } from '@/components/WalletActionButton';
import { TpSlSheetSkeleton } from '@/skeletons/TpSlSheetSkeleton';
import type { TpSlSheetData, TpSlValueType } from '@/types/ui';

interface TpSlSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: TpSlSheetData;
    loading?: boolean;
    onConfirm?: (payload: { tpPrice: string; slPrice: string; tpType: TpSlValueType; slType: TpSlValueType }) => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <XStack alignItems="center" justifyContent="space-between">
            <Text color="$textDisabled" fontSize={12} lineHeight={14} fontWeight={500}>
                {label}
            </Text>
            <Text color="$text" fontSize={12} lineHeight={14} fontWeight={500}>
                {value}
            </Text>
        </XStack>
    );
}

function parseNumericValue(text: string) {
    const value = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
    return Number.isFinite(value) ? value : 0;
}

function sanitizeDecimalInput(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const [integerPart, ...decimalParts] = cleaned.split('.');

    if (!decimalParts.length) {
        return integerPart;
    }

    return `${integerPart}.${decimalParts.join('')}`;
}

function formatPriceValue(value: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPercentValue(value: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function derivePercentText(priceText: string, operator: '+' | '-', entryPrice: number) {
    if (!priceText || entryPrice <= 0) {
        return '';
    }

    const price = parseNumericValue(priceText);
    if (!Number.isFinite(price) || price <= 0) {
        return '';
    }

    const percent =
        operator === '+' ? ((price - entryPrice) / entryPrice) * 100 : ((entryPrice - price) / entryPrice) * 100;

    if (!Number.isFinite(percent)) {
        return '';
    }

    return formatPercentValue(percent);
}

function derivePriceText(percentText: string, operator: '+' | '-', entryPrice: number) {
    if (!percentText || entryPrice <= 0) {
        return '';
    }

    const percent = Number.parseFloat(percentText);
    if (!Number.isFinite(percent)) {
        return '';
    }

    const price = operator === '+' ? entryPrice * (1 + percent / 100) : entryPrice * (1 - percent / 100);

    if (!Number.isFinite(price)) {
        return '';
    }

    return formatPriceValue(price);
}

function PercentField({
    sign,
    value,
    onChangeText,
}: {
    sign: '+' | '-';
    value: string;
    onChangeText: (text: string) => void;
}) {
    return (
        <XStack
            flex={1}
            height={32}
            borderWidth={1}
            borderColor="$borderSubdued"
            borderRadius={6}
            alignItems="center"
            paddingHorizontal={8}
        >
            <Text color="$textDisabled" fontSize={14} lineHeight={18} fontWeight={500}>
                {sign}
            </Text>

            <Input
                unstyled
                flex={1}
                value={value}
                onChangeText={onChangeText}
                keyboardType="numeric"
                color="$text"
                fontSize={14}
                lineHeight={18}
                fontWeight={500}
                textAlign="right"
                placeholder="0.00"
                placeholderTextColor="$textDisabled"
                padding={0}
                minWidth={20}
            />

            <Text color="$textDisabled" fontSize={14} lineHeight={18} fontWeight={500}>
                %
            </Text>
        </XStack>
    );
}

export const TpSlSheet = memo<TpSlSheetProps>(function TpSlSheet({
    open,
    onOpenChange,
    data,
    loading = false,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [tpPrice, setTpPrice] = useState(data.tpPrice);
    const [slPrice, setSlPrice] = useState(data.slPrice);
    const [tpPercent, setTpPercent] = useState('');
    const [slPercent, setSlPercent] = useState('');
    const entryPrice = parseNumericValue(data.entryPrice);

    useEffect(() => {
        setTpPrice(data.tpPrice);
        setSlPrice(data.slPrice);
        setTpPercent(derivePercentText(data.tpPrice, data.tpOperator, entryPrice));
        setSlPercent(derivePercentText(data.slPrice, data.slOperator, entryPrice));
    }, [data.tpPrice, data.slPrice, open]);

    const handleTpPriceChange = useCallback(
        (text: string) => {
            const nextPrice = sanitizeDecimalInput(text);
            setTpPrice(nextPrice);
            setTpPercent(derivePercentText(nextPrice, data.tpOperator, entryPrice));
        },
        [data.tpOperator, entryPrice],
    );

    const handleTpPercentChange = useCallback(
        (text: string) => {
            const nextPercent = sanitizeDecimalInput(text);
            setTpPercent(nextPercent);
            setTpPrice(derivePriceText(nextPercent, data.tpOperator, entryPrice));
        },
        [data.tpOperator, entryPrice],
    );

    const handleSlPriceChange = useCallback(
        (text: string) => {
            const nextPrice = sanitizeDecimalInput(text);
            setSlPrice(nextPrice);
            setSlPercent(derivePercentText(nextPrice, data.slOperator, entryPrice));
        },
        [data.slOperator, entryPrice],
    );

    const handleSlPercentChange = useCallback(
        (text: string) => {
            const nextPercent = sanitizeDecimalInput(text);
            setSlPercent(nextPercent);
            setSlPrice(derivePriceText(nextPercent, data.slOperator, entryPrice));
        },
        [data.slOperator, entryPrice],
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
                minHeight={352}
            >
                <SheetDragHandle />

                {loading ? <TpSlSheetSkeleton /> : null}

                {!loading ? (
                    <>
                        <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700}>
                            TP/SL
                        </Text>

                        <YStack gap={8}>
                            <MetaRow label="Symbol" value={data.symbol} />
                            <MetaRow label="Entry Price(USDC)" value={data.entryPrice} />
                            <MetaRow label="Mark Price(USDC)" value={data.markPrice} />
                            <MetaRow label="Est. Liq. Price(USDC)" value={data.estimatedLiqPrice} />
                        </YStack>

                        <YStack gap={8}>
                            <XStack gap={8}>
                                <XStack
                                    flex={1}
                                    height={32}
                                    borderWidth={1}
                                    borderColor="$borderSubdued"
                                    borderRadius={6}
                                    alignItems="center"
                                    paddingHorizontal={8}
                                >
                                    <Input
                                        unstyled
                                        value={tpPrice}
                                        onChangeText={handleTpPriceChange}
                                        keyboardType="numeric"
                                        color="$text"
                                        fontSize={14}
                                        lineHeight={18}
                                        fontWeight={500}
                                        placeholder="TP Price"
                                        placeholderTextColor="$textDisabled"
                                        flex={1}
                                    />
                                </XStack>
                                <PercentField
                                    sign={data.tpOperator}
                                    value={tpPercent}
                                    onChangeText={handleTpPercentChange}
                                />
                            </XStack>

                            <XStack gap={8}>
                                <XStack
                                    flex={1}
                                    height={32}
                                    borderWidth={1}
                                    borderColor="$borderSubdued"
                                    borderRadius={6}
                                    alignItems="center"
                                    paddingHorizontal={8}
                                >
                                    <Input
                                        unstyled
                                        value={slPrice}
                                        onChangeText={handleSlPriceChange}
                                        keyboardType="numeric"
                                        color="$text"
                                        fontSize={14}
                                        lineHeight={18}
                                        fontWeight={500}
                                        placeholder="SL Price"
                                        placeholderTextColor="$textDisabled"
                                        flex={1}
                                    />
                                </XStack>
                                <PercentField
                                    sign={data.slOperator}
                                    value={slPercent}
                                    onChangeText={handleSlPercentChange}
                                />
                            </XStack>
                        </YStack>

                        <WalletActionButton
                            unstyled
                            height={48}
                            borderRadius={96}
                            backgroundColor="$text"
                            alignItems="center"
                            justifyContent="center"
                            pressStyle={{ opacity: 0.9 }}
                            onPress={() => {
                                onConfirm?.({
                                    tpPrice,
                                    slPrice,
                                    tpType: data.tpType,
                                    slType: data.slType,
                                });
                                onOpenChange(false);
                            }}
                        >
                            <Text color="$bgHover" fontSize={16} lineHeight={24} fontWeight={700}>
                                Confirm
                            </Text>
                        </WalletActionButton>

                        <YStack alignItems="center" paddingTop={8}>
                            <YStack width={134} height={5} borderRadius={100} backgroundColor="$text" />
                        </YStack>
                    </>
                ) : null}
            </Sheet.Frame>
        </Sheet>
    );
});
