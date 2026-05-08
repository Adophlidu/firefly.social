import { BigNumber } from 'bignumber.js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { XStack, YStack } from 'tamagui';

import { TokenAmountInput } from '@/components/TokenAmountInput';
import { ComputeMethodPopover } from '@/components/TradeForm/ComputeMethodPopover';
import { dividedBy, isNumber, isZero, minus, multipliedBy } from '@/helpers/number';
import type { ComputeMethod } from '@/types/ui';

interface TpSlSettingsProps {
    leverage: number;
    price: string;
    size: string;
    tpPrice: string;
    slPrice: string;
    decimal?: number;
    onTpPriceChange: (price: string) => void;
    onSlPriceChange: (price: string) => void;
}

export const TpSlSettings = memo<TpSlSettingsProps>(function TpSlSettings({
    leverage,
    price,
    size,
    tpPrice,
    slPrice,
    decimal = 2,
    onTpPriceChange,
    onSlPriceChange,
}) {
    const [method, setMethod] = useState<ComputeMethod>('ratio');
    const [tpValue, setTpValue] = useState('');
    const [slValue, setSlValue] = useState('');
    const [tpRatio, setTpRatio] = useState('');
    const [slRatio, setSlRatio] = useState('');
    const isFocusing = useRef(false);

    const disabled = isZero(size);

    const updateTpRatio = useCallback(
        (newTpValue: string, newMethod: ComputeMethod) => {
            if (!newTpValue) {
                setTpRatio('');
                onTpPriceChange('');
                return;
            }

            const usdInWin = minus(newTpValue, price).multipliedBy(size);
            if (newMethod === 'usd') {
                setTpRatio(usdInWin.toFixed(0));
            } else {
                const usdInCost = multipliedBy(price, size).dividedBy(leverage);
                const ratio = dividedBy(usdInWin, usdInCost).multipliedBy(100).toFixed(2);
                setTpRatio(ratio);
            }

            onTpPriceChange(newTpValue);
        },
        [leverage, price, size, onTpPriceChange],
    );
    const onTpValueChange = useCallback(
        (value: string) => {
            const newTpValue = !value || !isNumber(value) ? '' : value;
            setTpValue(newTpValue);

            updateTpRatio(newTpValue, method);
        },
        [method, updateTpRatio],
    );

    const updateSlRatio = useCallback(
        (newSlValue: string, newMethod: ComputeMethod) => {
            if (!newSlValue) {
                setSlRatio('');
                onSlPriceChange('');
                return;
            }

            const usdInWin = minus(newSlValue, price).multipliedBy(size).multipliedBy(-1).toFixed(BigNumber.ROUND_DOWN);
            if (newMethod === 'usd') {
                setSlRatio(usdInWin);
            } else {
                const usdInCost = multipliedBy(price, size).dividedBy(leverage);
                const ratio = dividedBy(usdInWin, usdInCost).multipliedBy(100).toFixed(2, BigNumber.ROUND_DOWN);
                setSlRatio(ratio);
            }

            onSlPriceChange(newSlValue);
        },
        [leverage, price, size, onSlPriceChange],
    );
    const onSlValueChange = useCallback(
        (value: string) => {
            const newSlValue = !value || !isNumber(value) ? '' : value;
            setSlValue(newSlValue);

            updateSlRatio(newSlValue, method);
        },
        [method, updateSlRatio],
    );

    const onMethodChange = useCallback(
        (method: ComputeMethod) => {
            setMethod(method);

            updateTpRatio(tpValue, method);
            updateSlRatio(slValue, method);
        },
        [tpValue, slValue, updateTpRatio, updateSlRatio],
    );

    const onTpRatioChange = useCallback(
        (value: string) => {
            if (!value || value === '-' || !isNumber(value)) {
                setTpRatio(value);
                setTpValue('');
                onTpPriceChange('');
                return;
            }

            setTpRatio(value);

            const cost = dividedBy(multipliedBy(price, size), leverage);
            const newTpValue =
                method === 'usd'
                    ? dividedBy(value, size).plus(price).toFixed(0)
                    : dividedBy(value, 100).multipliedBy(cost).dividedBy(size).plus(price).toFixed(0);
            setTpValue(newTpValue);
            onTpPriceChange(newTpValue);
        },
        [leverage, price, size, method, onTpPriceChange],
    );
    const onSlRatioChange = useCallback(
        (value: string) => {
            if (!value || value === '-' || !isNumber(value)) {
                setSlRatio(value);
                setSlValue('');
                onSlPriceChange('');
                return;
            }

            setSlRatio(value);

            const cost = dividedBy(multipliedBy(price, size), leverage);
            const newSlValue =
                method === 'usd'
                    ? minus(price, dividedBy(value, size)).toFixed(0)
                    : minus(price, dividedBy(value, 100).multipliedBy(cost).dividedBy(size)).toFixed(0);
            setSlValue(newSlValue);
            onSlPriceChange(newSlValue);
        },
        [leverage, price, size, method, onSlPriceChange],
    );

    useEffect(() => {
        if (!tpPrice) {
            setTpValue('');
            setTpRatio('');
        }
    }, [tpPrice]);
    useEffect(() => {
        if (!slPrice) {
            setSlValue('');
            setSlRatio('');
        }
    }, [slPrice]);
    useEffect(() => {
        if (isFocusing.current) return;

        updateTpRatio(tpValue, method);
        updateSlRatio(slValue, method);
    }, [price, size, leverage, tpValue, slValue, method, updateTpRatio, updateSlRatio]);

    return (
        <YStack width="100%" gap={6}>
            <XStack gap={6} height={32}>
                <XStack
                    width="50%"
                    height="100%"
                    paddingHorizontal={8}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.15)"
                >
                    <TokenAmountInput
                        decimal={decimal}
                        disabled={disabled}
                        inputMode="decimal"
                        flex={1}
                        minWidth={0}
                        height="100%"
                        placeholder="TP Price"
                        value={tpValue}
                        onChangeText={onTpValueChange}
                        onFocus={() => (isFocusing.current = true)}
                        onBlur={() => (isFocusing.current = false)}
                    />
                </XStack>
                <XStack
                    width="50%"
                    height="100%"
                    paddingHorizontal={8}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.15)"
                >
                    <TokenAmountInput
                        decimal={2}
                        disabled={disabled}
                        inputMode="decimal"
                        flex={1}
                        minWidth={0}
                        height="100%"
                        placeholder="Gain"
                        value={tpRatio}
                        supportNegative
                        onChangeText={onTpRatioChange}
                        onFocus={() => (isFocusing.current = true)}
                        onBlur={() => (isFocusing.current = false)}
                    />
                    <ComputeMethodPopover disabled={disabled} type={method} onChange={onMethodChange} />
                </XStack>
            </XStack>
            <XStack gap={6} height={32}>
                <XStack
                    width="50%"
                    height="100%"
                    paddingHorizontal={8}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.15)"
                >
                    <TokenAmountInput
                        decimal={decimal}
                        disabled={disabled}
                        inputMode="decimal"
                        flex={1}
                        minWidth={0}
                        height="100%"
                        placeholder="SL Price"
                        value={slValue}
                        onChangeText={onSlValueChange}
                        onFocus={() => (isFocusing.current = true)}
                        onBlur={() => (isFocusing.current = false)}
                    />
                </XStack>
                <XStack
                    width="50%"
                    height="100%"
                    paddingHorizontal={8}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor="rgba(34, 33, 47, 0.15)"
                >
                    <TokenAmountInput
                        decimal={2}
                        disabled={disabled}
                        inputMode="decimal"
                        flex={1}
                        minWidth={0}
                        height="100%"
                        placeholder="Loss"
                        value={slRatio}
                        supportNegative
                        onChangeText={onSlRatioChange}
                        onFocus={() => (isFocusing.current = true)}
                        onBlur={() => (isFocusing.current = false)}
                    />
                    <ComputeMethodPopover disabled={disabled} type={method} onChange={onMethodChange} />
                </XStack>
            </XStack>
        </YStack>
    );
});
