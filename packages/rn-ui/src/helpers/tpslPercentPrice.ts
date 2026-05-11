import { BigNumber } from 'bignumber.js';

import { formatPrice } from '@/helpers/formatPrice';

export type TpslPositionSide = 'long' | 'short';

/** OneKey `formatPercentage` in `perpsUtils` — ROE % display string. */
export function formatTpslPercentDisplay(percent: number): string {
    if (!percent || Number.isNaN(percent)) {
        return '0';
    }

    const roundedBN = new BigNumber(percent).multipliedBy(100).integerValue(BigNumber.ROUND_HALF_UP).dividedBy(100);
    if (roundedBN.isInteger()) {
        return roundedBN.toFixed();
    }
    return roundedBN.toFixed(2).replace(/\.?0+$/, '');
}

/** OneKey `TpslInput` `isValidPercent`. */
export function isValidTpslPercentInput(value: string): boolean {
    return value === '' || /^-?(\d+\.?\d*|\d*\.\d+)$/.test(value);
}

/** OneKey `TpslInput` `canCalculate`. */
export function canCalculateTpslPercent(value: string): boolean {
    return value !== '' && value !== '-' && !Number.isNaN(Number(value));
}

function safeLeverage(leverage: number): BigNumber {
    const levBn = new BigNumber(leverage);
    return levBn.isFinite() && levBn.gt(0) ? levBn : new BigNumber(1);
}

function parseReferencePrice(referencePrice: string): BigNumber | null {
    const ref = new BigNumber(referencePrice.replace(/,/g, '').trim());
    if (!ref.isFinite() || ref.lte(0)) {
        return null;
    }
    return ref;
}

function parsePriceValue(priceValue: string): BigNumber | null {
    const priceNum = new BigNumber(priceValue.replace(/,/g, '').trim());
    if (!priceNum.isFinite() || priceNum.lte(0)) {
        return null;
    }
    return priceNum;
}

/**
 * OneKey `TpslInput` `calculatePercent`: ROE % from trigger price vs entry.
 */
export function tpslPriceToPercentDisplay(options: {
    referencePrice: string;
    priceValue: string;
    side: TpslPositionSide;
    isTp: boolean;
    leverage: number;
}): string {
    const { referencePrice, priceValue, side, isTp, leverage } = options;
    if (!priceValue.trim()) {
        return '';
    }
    const ref = parseReferencePrice(referencePrice);
    if (!ref) {
        return '';
    }
    const priceNum = parsePriceValue(priceValue);
    if (!priceNum) {
        return '';
    }

    const leverageBn = safeLeverage(leverage);
    const useFirstDiffBranch = (side === 'long') === isTp;
    const diff = useFirstDiffBranch ? priceNum.minus(ref) : ref.minus(priceNum);
    const rawPercent = diff.dividedBy(ref).multipliedBy(leverageBn).multipliedBy(100).toNumber();
    return formatTpslPercentDisplay(rawPercent);
}

/**
 * OneKey `TpslInput` `calculatePrice`: trigger price from ROE % vs entry.
 */
export function tpslPercentDisplayToPrice(options: {
    referencePrice: string;
    percentText: string;
    side: TpslPositionSide;
    isTp: boolean;
    leverage: number;
    szDecimals: number;
}): string {
    const { referencePrice, percentText, side, isTp, leverage, szDecimals } = options;
    if (!percentText.trim() || !canCalculateTpslPercent(percentText)) {
        return '';
    }
    const ref = parseReferencePrice(referencePrice);
    if (!ref) {
        return '';
    }

    const percentNum = new BigNumber(percentText);
    if (!percentNum.isFinite()) {
        return '';
    }

    const leverageBn = safeLeverage(leverage);
    const adjustedPercent = percentNum.dividedBy(leverageBn);
    const usePlusBranch = (side === 'long') === isTp;
    const multiplier = usePlusBranch
        ? new BigNumber(100).plus(adjustedPercent)
        : new BigNumber(100).minus(adjustedPercent);
    const raw = ref.multipliedBy(multiplier).dividedBy(100);
    if (!raw.isFinite()) {
        return '';
    }
    return formatPrice(raw, szDecimals);
}
