import { formatPrice } from '@/helpers/formatPrice';
import { minus, multipliedBy, plus } from '@/helpers/number';
import { store } from '@/store';
import { slippageAtom } from '@/store/tradeForm';

interface Options {
    price: string;
    isBuy: boolean;
    szDecimals: number;
    slippage?: string;
}

export function calculateSlippagePrice({ price, isBuy, szDecimals, slippage = store.get(slippageAtom) }: Options) {
    return formatPrice(
        isBuy ? multipliedBy(price, plus(1, slippage)) : multipliedBy(price, minus(1, slippage)),
        szDecimals,
    );
}
