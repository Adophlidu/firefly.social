import { MAX_DECIMALS_PERPS, MAX_DECIMALS_SPOT, MAX_SIGNIFICANT_FIGURES } from '../constants/static';

const MAX_PRICE_INTEGER_DIGITS = 12;

export function normalizePriceInput(input: string) {
    return input.replace(/。/g, '.');
}

export function validatePerpsPriceInput(input: string, szDecimals = 2): boolean {
    if (!input) return true;

    const text = normalizePriceInput(input);
    if (text === '00') return false;

    // Prevent leading zeros like "01", "001" but allow "0", "0.", "0.1"
    if (text.length > 1 && text[0] === '0' && text[1] !== '.') {
        return false;
    }

    const maxDecimals = MAX_DECIMALS_PERPS - szDecimals;

    if (!/^[0-9]*\.?[0-9]*$/.test(text) || text.split('.').length > 2) return false;
    if (maxDecimals === 0) return !/\./.test(text);

    const [integerPart = '0', decimalPart = ''] = text.split('.');
    if (integerPart.length > MAX_PRICE_INTEGER_DIGITS) return false;
    const hasDecimal = text.includes('.');

    if (decimalPart.length > Math.min(maxDecimals, 6)) return false;

    const integerLength = integerPart.replace(/^0+/, '').length;
    const isZeroInteger = integerLength === 0;

    if (integerLength >= MAX_SIGNIFICANT_FIGURES) return !hasDecimal;

    if (isZeroInteger) {
        const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0;
        return decimalPart.length - leadingZeros <= MAX_SIGNIFICANT_FIGURES;
    }

    return integerLength + decimalPart.length <= MAX_SIGNIFICANT_FIGURES;
}

export function validateSpotPriceInput(input: string, szDecimals = 0): boolean {
    if (!input) return true;

    const text = normalizePriceInput(input);
    if (text === '00') return false;

    if (text.length > 1 && text[0] === '0' && text[1] !== '.') {
        return false;
    }

    const maxDecimals = Math.max(0, MAX_DECIMALS_SPOT - szDecimals);

    if (!/^[0-9]*\.?[0-9]*$/.test(text) || text.split('.').length > 2) return false;
    if (maxDecimals <= 0) return !/\./.test(text);

    const [integerPart = '0', decimalPart = ''] = text.split('.');
    if (integerPart.length > MAX_PRICE_INTEGER_DIGITS) return false;
    const hasDecimal = text.includes('.');

    if (decimalPart.length > maxDecimals) return false;

    const integerLength = integerPart.replace(/^0+/, '').length;
    const isZeroInteger = integerLength === 0;

    if (integerLength >= MAX_SIGNIFICANT_FIGURES) return !hasDecimal;

    if (isZeroInteger) {
        const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0;
        return decimalPart.length - leadingZeros <= MAX_SIGNIFICANT_FIGURES;
    }

    return integerLength + decimalPart.length <= MAX_SIGNIFICANT_FIGURES;
}
