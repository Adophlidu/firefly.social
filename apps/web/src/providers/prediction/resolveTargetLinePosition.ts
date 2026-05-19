export type TargetLineClamp = 'none' | 'above' | 'below';

export interface ResolveTargetLinePositionParams {
    priceToBeat: number;
    ticks: number[];
}

export interface ResolveTargetLinePositionResult {
    clamp: TargetLineClamp;
    /** Price value passed to the Y scale when drawing the target line. */
    displayValue: number;
}

/**
 * When target is outside the labeled tick range, pin the line to the nearest tick
 * (Polymarket pins to max/min tick, not padded domain edge).
 */
export function resolveTargetLinePosition({
    priceToBeat,
    ticks,
}: ResolveTargetLinePositionParams): ResolveTargetLinePositionResult {
    if (ticks.length === 0) {
        return { clamp: 'none', displayValue: priceToBeat };
    }

    const tickMin = ticks[0];
    const tickMax = ticks[ticks.length - 1];

    if (priceToBeat > tickMax) {
        return { clamp: 'above', displayValue: tickMax };
    }

    if (priceToBeat < tickMin) {
        return { clamp: 'below', displayValue: tickMin };
    }

    return { clamp: 'none', displayValue: priceToBeat };
}
