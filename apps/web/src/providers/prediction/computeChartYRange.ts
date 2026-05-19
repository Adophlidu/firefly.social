/** Mirrors liveline's internal Y-range logic so SVG overlays align with the canvas chart. */
export interface ChartValuePoint {
    value: number;
}

export function computeChartYRange(
    visible: ChartValuePoint[],
    currentValue: number,
    options?: { exaggerate?: boolean },
): { min: number; max: number } {
    const exaggerate = options?.exaggerate ?? false;
    let targetMin = Infinity;
    let targetMax = -Infinity;

    for (const point of visible) {
        if (point.value < targetMin) targetMin = point.value;
        if (point.value > targetMax) targetMax = point.value;
    }

    if (currentValue < targetMin) targetMin = currentValue;
    if (currentValue > targetMax) targetMax = currentValue;

    const rawRange = targetMax - targetMin;
    const marginFactor = exaggerate ? 0.01 : 0.12;
    const minRange = rawRange * (exaggerate ? 0.02 : 0.1) || (exaggerate ? 0.04 : 0.4);

    if (rawRange < minRange) {
        const mid = (targetMin + targetMax) / 2;
        return { min: mid - minRange / 2, max: mid + minRange / 2 };
    }

    const margin = rawRange * marginFactor;
    return { min: targetMin - margin, max: targetMax + margin };
}

export function priceToChartY(
    value: number,
    range: { min: number; max: number },
    plotTop: number,
    plotHeight: number,
): number {
    const span = range.max - range.min;
    if (!Number.isFinite(span) || span <= 0) return plotTop + plotHeight / 2;

    const ratio = (value - range.min) / span;
    return plotTop + plotHeight * (1 - ratio);
}
