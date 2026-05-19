import { resolveTargetLinePosition, type TargetLineClamp } from '@/providers/prediction/resolveTargetLinePosition.js';

/** Half-height of the target pill — keep badge inside the plot when pinned to an edge. */
export const TARGET_BADGE_HALF_HEIGHT = 7;

export interface ResolveTargetLineLayoutParams {
    priceToBeat: number;
    ticks: number[];
    yScale: (value: number) => number;
    plotTop: number;
    plotHeight: number;
    /** Visible Y data range (liveline / recharts domain). */
    range: { min: number; max: number };
}

export interface ResolveTargetLineLayoutResult {
    y: number;
    clamp: TargetLineClamp;
}

/**
 * Maps target price to a pixel Y inside the plot, pinning to the top/bottom inset when
 * the target is outside the visible range (matches Polymarket live chart behavior).
 */
export function resolveTargetLineLayout({
    priceToBeat,
    ticks,
    yScale,
    plotTop,
    plotHeight,
    range,
}: ResolveTargetLineLayoutParams): ResolveTargetLineLayoutResult {
    const plotBottom = plotTop + plotHeight;
    const tickResult = resolveTargetLinePosition({ priceToBeat, ticks });
    const tickMin = ticks[0];
    const tickMax = ticks[ticks.length - 1];

    let clamp: TargetLineClamp = tickResult.clamp;

    if (priceToBeat > range.max || (ticks.length > 0 && priceToBeat > tickMax)) {
        clamp = 'above';
    } else if (priceToBeat < range.min || (ticks.length > 0 && priceToBeat < tickMin)) {
        clamp = 'below';
    }

    if (clamp === 'above') {
        return { y: plotTop + TARGET_BADGE_HALF_HEIGHT, clamp };
    }

    if (clamp === 'below') {
        return { y: plotBottom - TARGET_BADGE_HALF_HEIGHT, clamp };
    }

    const rawY = yScale(tickResult.clamp === 'none' ? priceToBeat : tickResult.displayValue);
    const y = Math.max(plotTop + TARGET_BADGE_HALF_HEIGHT, Math.min(plotBottom - TARGET_BADGE_HALF_HEIGHT, rawY));

    return { y, clamp: 'none' };
}
