import { BigNumber } from 'bignumber.js';

import { MAX_DECIMALS_PERPS, MAX_SIGNIFICANT_FIGURES } from '@/constants/static';

function _countSignificantFigures(price: BigNumber): number {
    if (price.isZero()) return 1;

    const priceStr = price.toFixed(); // Get fixed decimal representation
    const scientificMatch = priceStr.match(/^(\d+(?:\.\d+)?)e([+-]?\d+)$/i);

    if (scientificMatch) {
        // Handle scientific notation
        const [, mantissa] = scientificMatch;
        return mantissa.replace('.', '').replace(/^0+/, '').length;
    }

    // Remove decimal point and leading zeros
    const digits = priceStr.replace('.', '').replace(/^0+/, '');
    return digits.length;
}

export function getValidPriceDecimals(marketPrice: string | number): number {
    const price = new BigNumber(marketPrice);

    if (!price.isFinite() || price.isLessThanOrEqualTo(0)) {
        return 2; // Default fallback
    }

    // Rule 1: Integer prices are always allowed
    if (price.isInteger()) {
        return 0;
    }

    // Rule 2: Non-integer prices - apply 5 significant figures limit
    const priceStr = price.toFixed();
    const decimalIndex = priceStr.indexOf('.');

    if (decimalIndex === -1) {
        return 0; // No decimal point
    }

    const actualDecimals = priceStr.length - decimalIndex - 1;
    const significantFigures = _countSignificantFigures(price);

    // For non-integer prices, respect both significant figures and MAX_DECIMALS limits
    let maxAllowedDecimals = Math.min(actualDecimals, MAX_DECIMALS_PERPS);

    // Apply 5 significant figures limit
    if (significantFigures > MAX_SIGNIFICANT_FIGURES) {
        const integerPart = price.integerValue(BigNumber.ROUND_DOWN);
        const integerDigits = integerPart.isZero() ? 0 : integerPart.toFixed().length;

        if (integerDigits >= MAX_SIGNIFICANT_FIGURES) {
            maxAllowedDecimals = 0;
        } else {
            const remainingSignificantFigures = MAX_SIGNIFICANT_FIGURES - integerDigits;
            maxAllowedDecimals = Math.min(maxAllowedDecimals, remainingSignificantFigures);
        }
    }

    return Math.max(0, maxAllowedDecimals);
}
