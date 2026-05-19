export const CRYPTO_PRICE_Y_TICK_COUNT = 6;

interface ComputeCryptoPriceYTicksParams {
    values: number[];
    tickCount?: number;
}

export interface CryptoPriceYTicksResult {
    ticks: number[];
    domain: [number, number];
}

function niceNum(range: number, round: boolean): number {
    if (!Number.isFinite(range) || range <= 0) return 1;

    const exponent = Math.floor(Math.log10(range));
    const fraction = range / 10 ** exponent;
    let niceFraction: number;

    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * 10 ** exponent;
}

function buildTicks(tickMin: number, step: number, tickCount: number): number[] {
    return Array.from({ length: tickCount }, (_, index) => tickMin + step * index);
}

export function computeCryptoPriceYTicks({
    values,
    tickCount = CRYPTO_PRICE_Y_TICK_COUNT,
}: ComputeCryptoPriceYTicksParams): CryptoPriceYTicksResult {
    if (tickCount < 2) {
        throw new Error('tickCount must be at least 2');
    }

    const allValues = [...values];

    if (allValues.length === 0) {
        const ticks = buildTicks(0, 1, tickCount);
        const step = 1;
        return {
            ticks,
            domain: [ticks[0] - step, ticks[ticks.length - 1] + step],
        };
    }

    let min = Math.min(...allValues);
    let max = Math.max(...allValues);

    if (min === max) {
        const padding = min === 0 ? 1 : Math.abs(min) * 0.01;
        min -= padding;
        max += padding;
    }

    const roughStep = (max - min) / (tickCount - 1);
    let step = niceNum(roughStep, true);
    const magnitudeStep = niceNum(Math.max(max, 1) * 0.003, true);
    if (step < magnitudeStep) {
        step = magnitudeStep;
    }

    const span = step * (tickCount - 1);
    const center = (min + max) / 2;
    let tickMin = Math.floor((center - span / 2) / step) * step;
    let tickMax = tickMin + span;

    while (tickMin > min) {
        tickMin -= step;
        tickMax -= step;
    }

    while (tickMax < max) {
        tickMin += step;
        tickMax += step;
    }

    const ticks = buildTicks(tickMin, step, tickCount);

    // Pad scale by one step so the bottom/top grid lines sit inside the plot,
    // leaving margin room for X-axis labels below the lowest line.
    return {
        ticks,
        domain: [ticks[0] - step, ticks[ticks.length - 1] + step],
    };
}
