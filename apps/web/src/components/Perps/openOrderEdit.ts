import type { PerpsOrderEditField } from '@dimensiondev/iframe-bridge';
import { normalizePriceInput, validatePerpsPriceInput } from '@dimensiondev/perps-core';
import BigNumber from 'bignumber.js';

export function normalizeOpenOrderEditInput(value: string) {
    return normalizePriceInput(value);
}

export function isOpenOrderEditChanged(value: string, currentValue: string) {
    const next = new BigNumber(value);
    const current = new BigNumber(currentValue);
    return next.isFinite() && current.isFinite() && !next.eq(current);
}

export function isValidOpenOrderEdit(value: string, field: PerpsOrderEditField, szDecimals: number) {
    if (field === 'price') {
        return validatePerpsPriceInput(value, szDecimals) && new BigNumber(value).gt(0);
    }
    const size = new BigNumber(value);
    return /^\d+(?:\.\d+)?$/.test(value) && size.isFinite() && size.gt(0) && (size.decimalPlaces() ?? 0) <= szDecimals;
}
