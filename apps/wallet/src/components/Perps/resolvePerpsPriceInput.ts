import { normalizePriceInput, validatePerpsPriceInput } from '@dimensiondev/perps-core';

export function resolvePerpsPriceInput(input: string, szDecimals: number) {
    const normalized = normalizePriceInput(input);
    return validatePerpsPriceInput(normalized, szDecimals) ? normalized : null;
}
