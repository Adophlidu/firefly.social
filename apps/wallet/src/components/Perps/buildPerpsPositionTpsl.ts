import { calculateSlippagePrice, validatePerpsPriceInput } from '@dimensiondev/perps-core';
import BigNumber from 'bignumber.js';

interface BuildPerpsPositionTpslOptions {
    asset: number;
    isLong: boolean;
    markPrice: string;
    szDecimals: number;
    tpPrice?: string;
    slPrice?: string;
}

export function buildPerpsPositionTpsl({
    asset,
    isLong,
    markPrice,
    szDecimals,
    tpPrice,
    slPrice,
}: BuildPerpsPositionTpslOptions) {
    const mark = new BigNumber(markPrice);
    if (!mark.isFinite() || mark.lte(0)) throw new Error('Mark price is unavailable.');

    const triggerOrders = [
        tpPrice ? { triggerPx: tpPrice, tpsl: 'tp' as const } : null,
        slPrice ? { triggerPx: slPrice, tpsl: 'sl' as const } : null,
    ].filter((value): value is { triggerPx: string; tpsl: 'tp' | 'sl' } => Boolean(value));
    if (!triggerOrders.length) throw new Error('Enter a take-profit or stop-loss price.');

    for (const { triggerPx, tpsl } of triggerOrders) {
        const trigger = new BigNumber(triggerPx);
        if (!trigger.isFinite() || trigger.lte(0) || !validatePerpsPriceInput(triggerPx, szDecimals)) {
            throw new Error('Enter a valid TP/SL price.');
        }
        const invalidTp = tpsl === 'tp' && (isLong ? trigger.lte(mark) : trigger.gte(mark));
        const invalidSl = tpsl === 'sl' && (isLong ? trigger.gte(mark) : trigger.lte(mark));
        if (invalidTp) {
            throw new Error(isLong ? 'Take profit must be above mark price.' : 'Take profit must be below mark price.');
        }
        if (invalidSl) {
            throw new Error(isLong ? 'Stop loss must be below mark price.' : 'Stop loss must be above mark price.');
        }
    }

    return {
        grouping: 'positionTpsl' as const,
        orders: triggerOrders.map(({ triggerPx, tpsl }) => ({
            a: asset,
            b: !isLong,
            p: calculateSlippagePrice({ price: triggerPx, isBuy: !isLong, szDecimals }),
            s: '0',
            r: true,
            t: { trigger: { isMarket: true, tpsl, triggerPx } } as const,
        })),
    };
}
