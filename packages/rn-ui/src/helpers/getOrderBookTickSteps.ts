import { BigNumber } from 'bignumber.js';

import { MAX_DECIMALS_PERPS, MAX_DECIMALS_SPOT } from '@/constants/static';

function getMinTick(currentPrice: number, szDecimals: number, isSpot = false): number {
    const maxDecimalsAllowed = (isSpot ? MAX_DECIMALS_SPOT : MAX_DECIMALS_PERPS) - szDecimals;

    const magnitude = Math.floor(Math.log10(currentPrice));
    const tickBySigFigs = Math.pow(10, magnitude - 4);

    const tickByDecimals = Math.pow(10, -maxDecimalsAllowed);

    const minTick = Math.max(tickBySigFigs, tickByDecimals);

    return parseFloat(minTick.toPrecision(1));
}

interface Options {
    midPrice: string;
    szDecimals: number;
    isSpot?: boolean;
}

export function getOrderBookTickSteps({ midPrice, szDecimals, isSpot = false }: Options): number[] {
    const steps: number[] = [];

    const price = BigNumber(midPrice).toNumber();
    const minTick = getMinTick(price, szDecimals, isSpot);
    const magnitude = Math.pow(10, Math.floor(Math.log10(price)) - 4);
    const startScale = Math.max(magnitude, minTick);

    // base steps
    steps.push(
        parseFloat(startScale.toPrecision(1)),
        parseFloat((startScale * 2).toPrecision(1)),
        parseFloat((startScale * 5).toPrecision(1)),
    );

    steps.push(
        parseFloat((startScale * 10).toPrecision(1)),
        parseFloat((startScale * 100).toPrecision(1)),
        parseFloat((startScale * 1000).toPrecision(1)),
    );

    return Array.from(new Set(steps))
        .filter((s) => s >= minTick)
        .sort((a, b) => a - b);
}
