import { BigNumber } from 'bignumber.js';
import { atom } from 'jotai';

import { OrderType, TradeMarginMode } from '@/constants/enum';
import { MAX_DECIMALS_PERPS } from '@/constants/static';
import { formatPrice } from '@/helpers/formatPrice';
import { dividedBy, isNumber, isZero, multipliedBy } from '@/helpers/number';
import { resolveCoinStatic } from '@/helpers/perpsCoinInfoResolve';
import { isValidSize } from '@/helpers/tradeForm';
import { allMetaAtom } from '@/store/meta';
import type { OrderSafeType, SizeInputType } from '@/types/ui';

export const coinNameAtom = atom<string>('BTC');
export const sizeDecimalAtom = atom<number>(1);
export const marketPriceAtom = atom<string>('0');
export const midPriceAtom = atom<string>('0');
export const coinIndexAtom = atom<number | null>((get) => {
    const coinName = get(coinNameAtom);
    const allMeta = get(allMetaAtom);
    if (allMeta.status !== 'success') return null;

    const staticPart = resolveCoinStatic(allMeta.data, coinName);
    return staticPart?.hlCoinIndex ?? null;
});

export const marginModeAtom = atom<TradeMarginMode>(TradeMarginMode.ISOLATED);
export const leverageAtom = atom<number>(1);
export const assetBalanceAtom = atom<string>('0');
export const orderTypeAtom = atom<OrderType>(OrderType.MARKET);
export const limitPriceAtom = atom<string>('0');
export const sizeAtom = atom<string>('0');
export const sizeInputTypeAtom = atom<SizeInputType>('amount');
export const sizeInputValueAtom = atom<string>('');
export const sliderValueAtom = atom<number>(0);
export const orderSafeTypeAtom = atom<OrderSafeType>('tpSl');
export const slippageAtom = atom<string>('0.08');

export const tpRatioAtom = atom<string>('');
export const slRatioAtom = atom<string>('');

// sheet
export const leverageSheetOpenAtom = atom(false);
export const marginModeSheetOpenAtom = atom(false);
export const acceptTermsSheetOpenAtom = atom(false);

export const currentPriceAtom = atom((get) => {
    const orderType = get(orderTypeAtom);
    const limitPrice = get(limitPriceAtom);
    const marketPrice = get(marketPriceAtom);

    if (orderType === OrderType.MARKET) {
        return isNumber(marketPrice) ? marketPrice : '0';
    }

    return isNumber(limitPrice) ? limitPrice : '0';
});
// balance with leverage
export const enlargedBalanceAtom = atom((get) => {
    const balance = get(assetBalanceAtom);
    const leverage = get(leverageAtom);

    if (!isNumber(balance)) return '0';

    return multipliedBy(balance, leverage).toString();
});
export const priceDecimalAtom = atom((get) => Math.max(0, MAX_DECIMALS_PERPS - get(sizeDecimalAtom)));

const updateSliderValueAtom = atom(null, (get, set) => {
    const balance = get(enlargedBalanceAtom);
    const inputType = get(sizeInputTypeAtom);
    const currentPrice = get(currentPriceAtom);
    const inputValue = get(sizeInputValueAtom);

    if (
        isZero(balance) ||
        isZero(currentPrice) ||
        isZero(inputValue) ||
        !isNumber(balance) ||
        !isNumber(currentPrice) ||
        !isNumber(inputValue)
    ) {
        set(sliderValueAtom, 0);
        return;
    }

    const newSliderValue =
        inputType === 'usd'
            ? dividedBy(inputValue, balance).multipliedBy(100)
            : dividedBy(multipliedBy(inputValue, currentPrice), balance).multipliedBy(100);
    if (newSliderValue.isNaN() || !newSliderValue.isFinite()) {
        set(sliderValueAtom, 0);
    } else {
        set(sliderValueAtom, Math.min(Math.max(Number(newSliderValue), 0), 100));
    }
});

// order type change
export const toggleOrderTypeAtom = atom(null, (get, set, newValue: OrderType) => {
    const midPrice = get(midPriceAtom);

    set(orderTypeAtom, newValue);
    set(
        limitPriceAtom,
        newValue === OrderType.MARKET || !isNumber(midPrice) ? '0' : formatPrice(midPrice, get(sizeDecimalAtom)),
    );

    set(updateSliderValueAtom);
});
export const setSizeAtom = atom(null, (_, set, newValue: string) => {
    const formatted = new BigNumber(newValue);
    const isInvalid = formatted.isNaN() || !formatted.isFinite() || formatted.isNegative();
    set(sizeAtom, isInvalid ? '0' : newValue);
});
// amount/usdc input change
export const setSizeInputValueAtom = atom(null, (get, set, newValue: string) => {
    if (!newValue || !isNumber(newValue)) {
        set(sizeInputValueAtom, '');
        set(sliderValueAtom, 0);
        return;
    }

    const inputType = get(sizeInputTypeAtom);
    const currentPrice = get(currentPriceAtom);
    const balance = get(enlargedBalanceAtom);

    const usdcValue = inputType === 'usd' ? newValue : multipliedBy(newValue, currentPrice).toString();
    const sliderValue = dividedBy(usdcValue, balance).multipliedBy(100).toFixed(BigNumber.ROUND_DOWN);
    set(sliderValueAtom, Math.min(Math.max(Number(sliderValue), 0), 100));

    if (inputType === 'amount') {
        set(setSizeAtom, newValue);
    } else {
        const newSize = dividedBy(newValue, currentPrice);
        set(setSizeAtom, newSize.toFixed(get(sizeDecimalAtom), BigNumber.ROUND_DOWN));
    }

    set(sizeInputValueAtom, newValue);
});
// slider value change
export const setSliderValueAtom = atom(null, (get, set, newValue: number) => {
    const balance = get(enlargedBalanceAtom);
    const currentPrice = get(currentPriceAtom);
    const inputType = get(sizeInputTypeAtom);
    const decimal = get(sizeDecimalAtom);

    if (isZero(balance) || isZero(currentPrice)) {
        set(sliderValueAtom, 0);
        set(setSizeAtom, '0');
        set(sizeInputValueAtom, '0');
        return;
    }

    const usdcValue = multipliedBy(balance, newValue / 100);
    const newSize = dividedBy(usdcValue, currentPrice).toFixed(decimal, BigNumber.ROUND_DOWN);
    set(setSizeAtom, newSize);
    set(sizeInputValueAtom, inputType === 'amount' ? newSize : formatPrice(usdcValue, decimal));

    set(sliderValueAtom, newValue);
});
// switch amount/usdc
export const setInputTypeAtom = atom(null, (get, set, newValue: SizeInputType) => {
    const size = get(sizeAtom);
    const decimal = get(sizeDecimalAtom);

    set(sizeInputTypeAtom, newValue);

    if (!isValidSize(size)) {
        set(setSizeInputValueAtom, '');
        return;
    }

    if (newValue === 'amount') {
        set(setSizeInputValueAtom, BigNumber(size).toFixed(decimal, BigNumber.ROUND_DOWN));
    } else {
        const currentPrice = get(currentPriceAtom);
        const usdcValue = multipliedBy(size, currentPrice);
        set(setSizeInputValueAtom, formatPrice(usdcValue, decimal));
    }
});
// limit price change
export const setLimitPriceAtom = atom(null, (get, set, newValue: string) => {
    const midPrice = get(midPriceAtom);
    const validMidPrice = isNumber(midPrice) ? formatPrice(midPrice, get(sizeDecimalAtom)) : '0';
    const validPrice = isNumber(newValue) || !newValue ? newValue : validMidPrice;
    set(limitPriceAtom, validPrice);

    set(updateSliderValueAtom);
});
// update leverage
export const setLeverageAtom = atom(null, (_, set, newValue: number) => {
    set(leverageAtom, newValue);

    set(updateSliderValueAtom);
});
// order safe type change
export const setOrderSafeTypeAtom = atom(null, (_, set, newValue: OrderSafeType) => {
    set(orderSafeTypeAtom, newValue);
});
// coin change
export const setCoinNameAtom = atom(null, (_, set, newValue: string) => {
    set(coinNameAtom, newValue);

    // reset data when coin changed
    set(sizeAtom, '0');
    set(sizeInputValueAtom, '');
    set(sliderValueAtom, 0);
    set(orderTypeAtom, OrderType.MARKET);
    set(tpRatioAtom, '');
    set(slRatioAtom, '');
    set(limitPriceAtom, '0');
});
