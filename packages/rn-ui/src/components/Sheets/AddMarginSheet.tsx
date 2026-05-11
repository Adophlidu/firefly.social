import { AlertCircle } from '@tamagui/lucide-icons-2';
import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Sheet, Text, XStack, YStack } from 'tamagui';

import { CoinAvatar } from '@/components/CoinAvatar';
import { SheetDragHandle } from '@/components/SheetDragHandle';
import { TokenAmountInput } from '@/components/TokenAmountInput';
import { formatAmount } from '@/helpers/formatAmount';
import { formatUSDC } from '@/helpers/formatUSDC';
import { isGreaterThan, isLessThan, plus } from '@/helpers/number';
import { MIN_ISOLATED_MARGIN_ADD_USD } from '@/hooks/Perps/useAdjustIsolatedMargin';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { usePerpsComputedAccountValue } from '@/hooks/Perps/usePerpsComputedAccountValue';
import type { Position } from '@/types/ui';

interface AddMarginSheetProps {
    open: boolean;
    coinName: string;
    position: Position | null;
    onOpenChange: (open: boolean) => void;
    onConfirm?: (amountUsd: string) => void | Promise<void>;
    isSubmitting?: boolean;
}

export const AddMarginSheet = memo<AddMarginSheetProps>(function AddMarginSheet({
    open,
    coinName,
    position,
    onOpenChange,
    onConfirm,
    isSubmitting = false,
}) {
    const [sheetPosition, setSheetPosition] = useState(0);
    const [amount, setAmount] = useState('');
    const { data: coinInfo } = useCoinInfo(coinName);
    const { withdrawable } = usePerpsComputedAccountValue();

    const marketPrice = coinInfo?.assetCtx?.markPx;
    const maxAdd = useMemo(() => new BigNumber(withdrawable || '0'), [withdrawable]);

    const amountBn = useMemo(() => new BigNumber(amount || '0'), [amount]);

    const showMinimumWarning = useMemo(() => {
        if (!amount || amountBn.isNaN() || !amountBn.isFinite() || amountBn.lte(0)) return false;
        return isLessThan(amountBn, MIN_ISOLATED_MARGIN_ADD_USD);
    }, [amount, amountBn]);

    const isValidAmount = useMemo(() => {
        if (!amount || amountBn.isNaN() || !amountBn.isFinite()) return false;
        if (amountBn.lte(0)) return false;
        if (isLessThan(amountBn, MIN_ISOLATED_MARGIN_ADD_USD)) return false;
        if (isGreaterThan(amountBn, maxAdd)) return false;
        return true;
    }, [amount, amountBn, maxAdd]);

    const newTotalMargin = useMemo(() => {
        if (!position?.marginUsed || !isValidAmount) return '';
        const sum = plus(position.marginUsed, amountBn);
        if (sum.isNaN() || !sum.isFinite()) return '';
        return formatUSDC(sum);
    }, [position?.marginUsed, amountBn, isValidAmount]);

    useEffect(() => {
        if (!open) {
            setAmount('');
        }
    }, [open]);

    const handleConfirm = useCallback(async () => {
        if (!isValidAmount || isSubmitting) return;
        await onConfirm?.(amountBn.decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed(2));
    }, [amountBn, isValidAmount, isSubmitting, onConfirm]);

    const liqDisplay = position?.liquidationPx ? formatAmount(position.liquidationPx, 4) : '--';

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
            >
                <SheetDragHandle />

                <YStack width="100%">
                    <XStack width="100%" alignItems="center" justifyContent="space-between" paddingTop={12}>
                        <Text color="$text" fontSize={20} lineHeight={24} fontWeight={700} fontFamily="$body">
                            Add to Position
                        </Text>
                        <YStack width={24} height={24} />
                    </XStack>
                </YStack>

                <XStack width="100%" alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$2">
                        <CoinAvatar name={coinName} size={30} />
                        <Text color="$text" fontSize={14} fontWeight={600}>
                            Current Price
                        </Text>
                    </XStack>

                    <Text color="$text" fontSize={16} fontWeight={600}>
                        {marketPrice ? formatUSDC(marketPrice) : '--'}
                    </Text>
                </XStack>

                <YStack
                    width="100%"
                    borderWidth={1}
                    borderColor="$borderSubdued"
                    borderRadius={16}
                    paddingVertical={12}
                    gap={4}
                >
                    <YStack paddingHorizontal={12} gap={4}>
                        <XStack width="100%" alignItems="center" justifyContent="space-between">
                            <Text fontSize={13} fontWeight={500} color="$textSubdued">
                                Amount
                            </Text>
                            <XStack
                                width={128}
                                height={40}
                                paddingHorizontal={8}
                                borderRadius={8}
                                borderWidth={1}
                                borderColor="$borderSubdued"
                                alignItems="center"
                                justifyContent="flex-end"
                            >
                                <TokenAmountInput
                                    decimal={2}
                                    flex={1}
                                    minWidth={0}
                                    textAlign="right"
                                    fontSize={14}
                                    fontWeight={500}
                                    color="$text"
                                    placeholder="0.00"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </XStack>
                        </XStack>

                        {showMinimumWarning ? (
                            <XStack width="100%" alignItems="center" justifyContent="flex-end" gap={4}>
                                <AlertCircle size={16} color="$textCritical" />
                                <Text fontSize={13} fontWeight={600} color="$textCritical">
                                    Minimum {formatUSDC(MIN_ISOLATED_MARGIN_ADD_USD)}
                                </Text>
                            </XStack>
                        ) : null}

                        <XStack width="100%" alignItems="center" justifyContent="space-between" marginTop={4}>
                            <Text fontSize={13} fontWeight={500} color="$textSubdued">
                                Liquidation Price
                            </Text>
                            <Text fontSize={14} fontWeight={500} color="$text">
                                {liqDisplay === '--' ? '--' : `$${liqDisplay}`}
                            </Text>
                        </XStack>
                    </YStack>

                    <YStack height={1} width="100%" backgroundColor="$borderSubdued" />

                    <XStack width="100%" alignItems="center" justifyContent="space-between" paddingHorizontal={12}>
                        <Text fontSize={13} fontWeight={500} color="$textSubdued">
                            New Total
                        </Text>
                        <Text fontSize={14} fontWeight={500} color="$text">
                            {newTotalMargin || '--'}
                        </Text>
                    </XStack>
                </YStack>

                <XStack gap={16} width="100%">
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        borderWidth={1}
                        borderColor="$text"
                        justifyContent="center"
                        disabled={isSubmitting}
                        onPress={() => onOpenChange(false)}
                    >
                        <Text fontSize={14} fontWeight={700} color="$text">
                            Cancel
                        </Text>
                    </Button>
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        backgroundColor={!isValidAmount || isSubmitting ? '$bgSubdued' : '$text'}
                        justifyContent="center"
                        disabled={!isValidAmount || isSubmitting}
                        opacity={1}
                        onPress={() => {
                            void handleConfirm();
                        }}
                    >
                        <Text
                            fontSize={16}
                            fontWeight={700}
                            color={!isValidAmount || isSubmitting ? '$textSubdued' : '$bgHover'}
                        >
                            Add
                        </Text>
                    </Button>
                </XStack>
            </Sheet.Frame>
        </Sheet>
    );
});
