import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { UnstyledInput } from '@/components/UnstyledInput';
import { WalletActionButton } from '@/components/WalletActionButton';
import { formatAmount } from '@/helpers/formatAmount';
import { isValidSize } from '@/helpers/isValidSize';
import { normalizePriceInput, validatePerpsPriceInput } from '@/helpers/perpsPriceValidation';
import { computeTpslExpectedPnlUsd, type TpslExpectedPnlResult } from '@/helpers/tpslExpectedPnl';
import {
    canCalculateTpslPercent,
    isValidTpslPercentInput,
    tpslPercentDisplayToPrice,
    tpslPriceToPercentDisplay,
} from '@/helpers/tpslPercentPrice';
import { TpSlSheetSkeleton } from '@/skeletons/TpSlSheetSkeleton';
import type { TpSlSheetData, TpSlValueType } from '@/types/ui';

export interface TpSlExistingSide {
    triggerPx: string;
    onCancel: () => void | Promise<void>;
}

interface TpSlSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: TpSlSheetData;
    loading?: boolean;
    /** When set, TP inputs are hidden and this row + Cancel is shown (OneKey-style). */
    existingTp?: TpSlExistingSide;
    existingSl?: TpSlExistingSide;
    /** Disables TP/SL cancel actions while a cancel request is in flight. */
    cancelLoading?: boolean;
    /** While submitting new TP/SL to the exchange. */
    confirmLoading?: boolean;
    onConfirm?: (payload: {
        tpPrice: string;
        slPrice: string;
        tpType: TpSlValueType;
        slType: TpSlValueType;
    }) => void | Promise<boolean>;
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

function ExistingSideRow({
    label,
    triggerPx,
    onCancel,
    disabled,
    pnlLabel,
    expectedPnl,
}: {
    label: string;
    triggerPx: string;
    onCancel: () => void | Promise<void>;
    disabled?: boolean;
    /** OneKey-style profit (TP) or loss (SL) subtitle when order exists. */
    pnlLabel?: 'profit' | 'loss';
    expectedPnl?: TpslExpectedPnlResult;
}) {
    const display = formatAmount(triggerPx, 4);
    const pnlColor = expectedPnl && !expectedPnl.isNegative ? '$textSuccess' : expectedPnl ? '$textCritical' : '$text';
    const pnlPrefix = pnlLabel === 'loss' ? 'Loss' : 'Profit';

    return (
        <YStack gap={4}>
            <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={8}>
                <Text color="$textDisabled" fontSize={12} lineHeight={14} fontWeight={500}>
                    {label}
                </Text>
                <XStack alignItems="center" gap={12}>
                    <Text color="$text" fontSize={14} lineHeight={18} fontWeight={600}>
                        {display}
                    </Text>
                    <Button
                        unstyled
                        disabled={disabled}
                        opacity={disabled ? 0.5 : 1}
                        onPress={disabled ? undefined : () => void onCancel()}
                    >
                        <Text
                            color={disabled ? '$textDisabled' : '$accent'}
                            fontSize={14}
                            lineHeight={18}
                            fontWeight={600}
                        >
                            Cancel
                        </Text>
                    </Button>
                </XStack>
            </XStack>
            {expectedPnl && pnlLabel ? (
                <XStack justifyContent="flex-end">
                    <Text color="$textDisabled" fontSize={12} lineHeight={16} fontWeight={500}>
                        {pnlPrefix}:{' '}
                    </Text>
                    <Text color={pnlColor} fontSize={12} lineHeight={16} fontWeight={600}>
                        {expectedPnl.isNegative ? '-' : ''}${expectedPnl.amountText}
                    </Text>
                </XStack>
            ) : null}
        </YStack>
    );
}

function normalizePercentTyping(text: string) {
    return text.replace(/。/g, '.');
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

            <UnstyledInput
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
    existingTp,
    existingSl,
    cancelLoading = false,
    confirmLoading = false,
    onConfirm,
}) {
    const [sheetPosition, setSheetPosition] = useState(0);
    const [tpPrice, setTpPrice] = useState(data.tpPrice);
    const [slPrice, setSlPrice] = useState(data.slPrice);
    const [tpPercent, setTpPercent] = useState('');
    const [slPercent, setSlPercent] = useState('');

    const referenceEntry = useMemo(() => data.entryPrice.replace(/,/g, '').trim(), [data.entryPrice]);

    useEffect(() => {
        setTpPrice(data.tpPrice);
        setSlPrice(data.slPrice);
        setTpPercent(
            data.tpPrice
                ? tpslPriceToPercentDisplay({
                      referencePrice: referenceEntry,
                      priceValue: data.tpPrice,
                      side: data.side,
                      isTp: true,
                      leverage: data.leverage,
                  })
                : '',
        );
        setSlPercent(
            data.slPrice
                ? tpslPriceToPercentDisplay({
                      referencePrice: referenceEntry,
                      priceValue: data.slPrice,
                      side: data.side,
                      isTp: false,
                      leverage: data.leverage,
                  })
                : '',
        );
    }, [data.tpPrice, data.slPrice, referenceEntry, data.side, data.leverage, data.szDecimals, open]);

    const handleTpPriceChange = useCallback(
        (text: string) => {
            const normalized = normalizePriceInput(text);
            if (normalized !== '' && !validatePerpsPriceInput(normalized, data.szDecimals)) {
                return;
            }
            setTpPrice(normalized);
            setTpPercent(
                normalized
                    ? tpslPriceToPercentDisplay({
                          referencePrice: referenceEntry,
                          priceValue: normalized,
                          side: data.side,
                          isTp: true,
                          leverage: data.leverage,
                      })
                    : '',
            );
        },
        [referenceEntry, data.side, data.leverage, data.szDecimals],
    );

    const handleTpPercentChange = useCallback(
        (text: string) => {
            const normalized = normalizePercentTyping(text);
            if (!isValidTpslPercentInput(normalized)) {
                return;
            }
            setTpPercent(normalized);
            const nextPrice = canCalculateTpslPercent(normalized)
                ? tpslPercentDisplayToPrice({
                      referencePrice: referenceEntry,
                      percentText: normalized,
                      side: data.side,
                      isTp: true,
                      leverage: data.leverage,
                      szDecimals: data.szDecimals,
                  })
                : '';
            setTpPrice(nextPrice);
        },
        [referenceEntry, data.side, data.leverage, data.szDecimals],
    );

    const handleSlPriceChange = useCallback(
        (text: string) => {
            const normalized = normalizePriceInput(text);
            if (normalized !== '' && !validatePerpsPriceInput(normalized, data.szDecimals)) {
                return;
            }
            setSlPrice(normalized);
            setSlPercent(
                normalized
                    ? tpslPriceToPercentDisplay({
                          referencePrice: referenceEntry,
                          priceValue: normalized,
                          side: data.side,
                          isTp: false,
                          leverage: data.leverage,
                      })
                    : '',
            );
        },
        [referenceEntry, data.side, data.leverage, data.szDecimals],
    );

    const handleSlPercentChange = useCallback(
        (text: string) => {
            const normalized = normalizePercentTyping(text);
            if (!isValidTpslPercentInput(normalized)) {
                return;
            }
            setSlPercent(normalized);
            const nextPrice = canCalculateTpslPercent(normalized)
                ? tpslPercentDisplayToPrice({
                      referencePrice: referenceEntry,
                      percentText: normalized,
                      side: data.side,
                      isTp: false,
                      leverage: data.leverage,
                      szDecimals: data.szDecimals,
                  })
                : '';
            setSlPrice(nextPrice);
        },
        [referenceEntry, data.side, data.leverage, data.szDecimals],
    );

    const strip = (raw: string) => raw.replace(/,/g, '').trim();
    const hasNewTp = Boolean(!existingTp && isValidSize(strip(tpPrice)));
    const hasNewSl = Boolean(!existingSl && isValidSize(strip(slPrice)));

    const canSubmit = hasNewTp || hasNewSl;

    const handleConfirm = useCallback(async () => {
        if (!canSubmit || confirmLoading) return;
        const result = await onConfirm?.({
            tpPrice,
            slPrice,
            tpType: data.tpType,
            slType: data.slType,
        });
        if (result !== false) {
            onOpenChange(false);
        }
    }, [canSubmit, confirmLoading, onConfirm, tpPrice, slPrice, data.tpType, data.slType, onOpenChange]);

    const existingTpPnl = useMemo(() => {
        if (!existingTp) return undefined;
        return computeTpslExpectedPnlUsd({
            entryPx: referenceEntry,
            exitPx: existingTp.triggerPx,
            positionSizeAbs: data.positionSizeAbs,
            side: data.side,
        });
    }, [existingTp, referenceEntry, data.positionSizeAbs, data.side]);

    const existingSlPnl = useMemo(() => {
        if (!existingSl) return undefined;
        return computeTpslExpectedPnlUsd({
            entryPx: referenceEntry,
            exitPx: existingSl.triggerPx,
            positionSizeAbs: data.positionSizeAbs,
            side: data.side,
        });
    }, [existingSl, referenceEntry, data.positionSizeAbs, data.side]);

    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onOpenChange}
            snapPointsMode="fit"
            dismissOnSnapToBottom
            position={sheetPosition}
            onPositionChange={setSheetPosition}
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
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
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

                        {existingTp ? (
                            <ExistingSideRow
                                label="Take profit"
                                triggerPx={existingTp.triggerPx}
                                onCancel={existingTp.onCancel}
                                disabled={cancelLoading}
                                pnlLabel="profit"
                                expectedPnl={existingTpPnl ?? undefined}
                            />
                        ) : null}

                        {existingSl ? (
                            <ExistingSideRow
                                label="Stop loss"
                                triggerPx={existingSl.triggerPx}
                                onCancel={existingSl.onCancel}
                                disabled={cancelLoading}
                                pnlLabel="loss"
                                expectedPnl={existingSlPnl ?? undefined}
                            />
                        ) : null}

                        {!existingTp || !existingSl ? (
                            <YStack gap={8}>
                                {!existingTp ? (
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
                                            <UnstyledInput
                                                value={tpPrice}
                                                onChangeText={handleTpPriceChange}
                                                keyboardType="numeric"
                                                color="$text"
                                                fontSize={14}
                                                height={32}
                                                lineHeight={18}
                                                fontWeight={500}
                                                placeholder="TP Price"
                                                placeholderTextColor="$textDisabled"
                                                flex={1}
                                            />
                                        </XStack>
                                        <PercentField sign="+" value={tpPercent} onChangeText={handleTpPercentChange} />
                                    </XStack>
                                ) : null}

                                {!existingSl ? (
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
                                            <UnstyledInput
                                                value={slPrice}
                                                onChangeText={handleSlPriceChange}
                                                keyboardType="numeric"
                                                color="$text"
                                                fontSize={14}
                                                height={32}
                                                lineHeight={18}
                                                fontWeight={500}
                                                placeholder="SL Price"
                                                placeholderTextColor="$textDisabled"
                                                flex={1}
                                            />
                                        </XStack>
                                        <PercentField sign="-" value={slPercent} onChangeText={handleSlPercentChange} />
                                    </XStack>
                                ) : null}
                            </YStack>
                        ) : null}

                        <WalletActionButton
                            unstyled
                            height={48}
                            borderRadius={96}
                            backgroundColor="$text"
                            alignItems="center"
                            justifyContent="center"
                            pressStyle={{ opacity: 0.9 }}
                            disabled={!canSubmit || confirmLoading || cancelLoading}
                            loading={confirmLoading}
                            onPress={() => {
                                void handleConfirm();
                            }}
                        >
                            <Text color="$bgHover" fontSize={16} lineHeight={24} fontWeight={700}>
                                Confirm
                            </Text>
                        </WalletActionButton>
                    </>
                ) : null}
            </Sheet.Frame>
        </Sheet>
    );
});
