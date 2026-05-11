import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Sheet, Slider, Text, XStack, YStack } from 'tamagui';

import { ButtonUI } from '@/components/ButtonUI';
import { CoinAvatar } from '@/components/CoinAvatar';
import { SheetDragHandle } from '@/components/SheetDragHandle';
import { TokenAmountInput } from '@/components/TokenAmountInput';
import { UsdPriceInput } from '@/components/UsdPriceInput';
import { formatCoinName } from '@/helpers/formatCoinName';
import { formatPrice } from '@/helpers/formatPrice';
import { dividedBy, isGreaterThan, isLessThan, isZero, minus, multipliedBy } from '@/helpers/number';
import { isValidSize } from '@/helpers/tradeForm';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';

interface LimitCloseSheetProps {
    open: boolean;
    coinName: string;
    size: string;
    entryPrice: string;
    type: 'limit' | 'market';
    onOpenChange: (open: boolean) => void;
    onConfirm?: (price: string, size: string) => void;
}

export const LimitCloseSheet = memo<LimitCloseSheetProps>(function LimitCloseSheet({
    open,
    coinName,
    size,
    entryPrice,
    type,
    onOpenChange,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [usdc, setUsdc] = useState('');
    const [amountRatio, setAmountRatio] = useState('');
    const { data: coinInfo } = useCoinInfo(coinName);

    const szDecimals = coinInfo?.szDecimals || 2;
    const midPrice = coinInfo?.assetCtx?.midPx;
    const marketPrice = coinInfo?.assetCtx?.markPx;
    const usdcToUse = type === 'limit' ? usdc : marketPrice || '0';
    const isSell = isLessThan(size, '0');
    const absSize = isSell ? size.slice(1) : size;

    const newSize = useMemo(() => {
        if (!amountRatio) return '0';
        if (isValidSize(absSize) && amountRatio === '100') return absSize;

        const newSize = multipliedBy(absSize, dividedBy(amountRatio || '0', 100));
        return newSize.isNaN() ? '0' : newSize.toFixed(szDecimals, BigNumber.ROUND_DOWN);
    }, [absSize, amountRatio, szDecimals]);
    const winInUsdc = useMemo(() => {
        if (!entryPrice || !usdcToUse || !newSize) return '';

        const win = minus(usdcToUse, entryPrice)
            .multipliedBy(newSize)
            .multipliedBy(isSell ? -1 : 1);
        return win.isNaN() ? '' : win.toFixed(2);
    }, [entryPrice, usdcToUse, newSize, isSell]);

    useEffect(() => {
        if (!open) {
            setUsdc('');
            setAmountRatio('');
        }
    }, [open]);

    const onSliderChange = useCallback((value: string) => {
        if (!value) {
            setAmountRatio('');
            return;
        }

        const ratioNum = parseFloat(`${value}`);
        if (ratioNum < 0 || ratioNum > 100) return;

        setAmountRatio(value);
    }, []);

    const disabled = !isValidSize(absSize);
    const winColor = winInUsdc ? (isGreaterThan(winInUsdc, 0) ? '$textSuccess' : '$textCritical') : '$text';
    const confirmDisabled = disabled || !usdcToUse || isZero(newSize) || !newSize;

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
                            {type === 'limit' ? 'Limit Close' : 'Market Close'}
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
                        {marketPrice ? `$${marketPrice}` : '--'}
                    </Text>
                </XStack>

                {/* usdc input */}
                {type === 'limit' ? (
                    <XStack width="100%" alignItems="center" justifyContent="space-between" gap="$2">
                        <Text fontSize={13} fontWeight={500} color="$textSubdued">
                            Price(USDC)
                        </Text>
                        <XStack
                            width={200}
                            height={40}
                            paddingHorizontal="$2"
                            borderRadius="$2"
                            borderWidth={1}
                            borderColor="$borderSubdued"
                            alignItems="center"
                            gap="$2"
                        >
                            <UsdPriceInput
                                disabled={disabled}
                                szDecimals={szDecimals}
                                flex={1}
                                minWidth={0}
                                value={usdc}
                                onChangeText={setUsdc}
                            />
                            {midPrice ? (
                                <Button
                                    unstyled
                                    flexShrink={0}
                                    onPress={() => {
                                        setUsdc(formatPrice(midPrice, szDecimals));
                                    }}
                                >
                                    <Text fontSize={14} fontWeight={500} color="$accent">
                                        Mid
                                    </Text>
                                </Button>
                            ) : null}
                        </XStack>
                    </XStack>
                ) : null}

                {/* amount input */}
                <XStack width="100%" alignItems="center" justifyContent="space-between" gap="$2">
                    <Text fontSize={13} fontWeight={500} color="$textSubdued">
                        Amount({formatCoinName(coinName)})
                    </Text>
                    <XStack
                        width={200}
                        height={40}
                        paddingHorizontal="$2"
                        borderRadius="$2"
                        borderWidth={1}
                        borderColor="$borderSubdued"
                        alignItems="center"
                        gap="$2"
                    >
                        <TokenAmountInput
                            disabled={disabled}
                            flex={1}
                            minWidth={0}
                            value={amountRatio}
                            onChangeText={onSliderChange}
                            decimal={0}
                        />
                        <Text fontSize={14} fontWeight={500} color="$text">
                            %
                        </Text>
                    </XStack>
                </XStack>

                <YStack height={24}>
                    <Slider
                        value={[parseInt(amountRatio || '0', 10)]}
                        onValueChange={([v]) => onSliderChange(`${v}`)}
                        max={100}
                        step={1}
                        size="$1"
                        disabled={disabled}
                    >
                        <Slider.Track backgroundColor="$bgSubdued" height={2}>
                            <Slider.TrackActive backgroundColor="$text" />
                        </Slider.Track>
                        <Slider.Thumb
                            index={0}
                            circular
                            size={14}
                            backgroundColor="$text"
                            borderWidth={2}
                            borderColor="$bg"
                        />
                    </Slider>
                </YStack>

                <XStack width="100" alignItems="center" justifyContent="space-between">
                    <Text fontSize={13} fontWeight={500} color="$textSubdued">
                        Size
                    </Text>
                    <Text fontSize={14} fontWeight={500} color="$text">
                        {newSize} {formatCoinName(coinName)}
                    </Text>
                </XStack>

                <XStack width="100" alignItems="center" justifyContent="space-between">
                    <Text fontSize={13} fontWeight={500} color="$textSubdued">
                        Est. Closed PnL
                    </Text>
                    <Text fontSize={14} fontWeight={500} color={winColor}>
                        {winInUsdc || '--'} USDC
                    </Text>
                </XStack>

                <XStack gap={16} width="100%">
                    <Button
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        borderWidth={1}
                        borderColor="$text"
                        justifyContent="center"
                        onPress={() => onOpenChange(false)}
                    >
                        <Text fontSize={16} fontWeight={700} color="$text">
                            Cancel
                        </Text>
                    </Button>
                    <ButtonUI
                        unstyled
                        height={48}
                        borderRadius={96}
                        flex={1}
                        backgroundColor="$text"
                        justifyContent="center"
                        disabled={confirmDisabled}
                        onPress={() => {
                            onConfirm?.(usdcToUse, newSize);
                            onOpenChange(false);
                        }}
                    >
                        <Text fontSize={16} fontWeight={700} color="$bgHover">
                            Close
                        </Text>
                    </ButtonUI>
                </XStack>
            </Sheet.Frame>
        </Sheet>
    );
});
