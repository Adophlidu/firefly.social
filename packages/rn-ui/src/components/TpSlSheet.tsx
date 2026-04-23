import { memo, useCallback, useEffect, useState } from 'react';
import { Input, Sheet, Text, XStack, YStack } from 'tamagui';

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
            <Text color="rgba(70, 70, 70, 0.4)" fontSize={12} lineHeight={14} fontWeight={500}>
                {label}
            </Text>
            <Text color="#171717" fontSize={12} lineHeight={14} fontWeight={500}>
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
            borderColor="rgba(34, 33, 47, 0.15)"
            borderRadius={6}
            alignItems="center"
            paddingHorizontal={8}
        >
            <Text color="rgba(70, 70, 70, 0.4)" fontSize={14} lineHeight={18} fontWeight={500}>
                {sign}
            </Text>

            <Input
                unstyled
                flex={1}
                value={value}
                onChangeText={onChangeText}
                keyboardType="numeric"
                color="#171717"
                fontSize={14}
                lineHeight={18}
                fontWeight={500}
                textAlign="right"
                placeholder="0.00"
                placeholderTextColor="rgba(70, 70, 70, 0.4)"
                padding={0}
                minWidth={20}
            />

            <Text color="rgba(70, 70, 70, 0.4)" fontSize={14} lineHeight={18} fontWeight={500}>
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
                minHeight={352}
            >
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                {loading ? <TpSlSheetSkeleton /> : null}

                {!loading ? (
                    <>
                        <Text color="#171717" fontSize={20} lineHeight={24} fontWeight={700}>
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
                                    borderColor="rgba(34, 33, 47, 0.15)"
                                    borderRadius={6}
                                    alignItems="center"
                                    paddingHorizontal={8}
                                >
                                    <Input
                                        unstyled
                                        value={tpPrice}
                                        onChangeText={handleTpPriceChange}
                                        keyboardType="numeric"
                                        color="#171717"
                                        fontSize={14}
                                        lineHeight={18}
                                        fontWeight={500}
                                        placeholder="TP Price"
                                        placeholderTextColor="rgba(70, 70, 70, 0.4)"
                                        width="100%"
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
                                    borderColor="rgba(34, 33, 47, 0.15)"
                                    borderRadius={6}
                                    alignItems="center"
                                    paddingHorizontal={8}
                                >
                                    <Input
                                        unstyled
                                        value={slPrice}
                                        onChangeText={handleSlPriceChange}
                                        keyboardType="numeric"
                                        color="#171717"
                                        fontSize={14}
                                        lineHeight={18}
                                        fontWeight={500}
                                        placeholder="SL Price"
                                        placeholderTextColor="rgba(70, 70, 70, 0.4)"
                                        width="100%"
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
                            backgroundColor="#171717"
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
                            <Text color="#E8E8E8" fontSize={16} lineHeight={24} fontWeight={700}>
                                Confirm
                            </Text>
                        </WalletActionButton>

                        <YStack alignItems="center" paddingTop={8}>
                            <YStack width={134} height={5} borderRadius={100} backgroundColor="#000000" />
                        </YStack>
                    </>
                ) : null}
            </Sheet.Frame>
        </Sheet>
    );
});
