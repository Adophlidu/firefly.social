import type { PerpsOrderEditField } from '@dimensiondev/iframe-bridge';
import { validatePerpsPriceInput } from '@dimensiondev/perps-core';
import type { ModifyParameters } from '@nktkas/hyperliquid/api/exchange';
import type { FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';
import BigNumber from 'bignumber.js';

type OpenOrder = FrontendOpenOrdersResponse[number];

interface Options {
    order: OpenOrder;
    asset: number;
    szDecimals: number;
    field: PerpsOrderEditField;
    value: string;
}

function validateSize(value: string, szDecimals: number) {
    const size = new BigNumber(value);
    return /^\d+(?:\.\d+)?$/.test(value) && size.isFinite() && size.gt(0) && (size.decimalPlaces() ?? 0) <= szDecimals;
}

function resolveOrderType(order: OpenOrder): ModifyParameters['order']['t'] {
    if (order.isTrigger) {
        return {
            trigger: {
                isMarket: order.orderType.includes('Market'),
                triggerPx: order.triggerPx,
                tpsl: order.orderType.startsWith('Take Profit') ? 'tp' : 'sl',
            },
        };
    }
    if (!order.tif || order.tif === 'LiquidationMarket') throw new Error('This order cannot be modified.');
    return { limit: { tif: order.tif } };
}

export function buildPerpsModifyOrder({ order, asset, szDecimals, field, value }: Options): ModifyParameters {
    if (field === 'size' && order.isPositionTpsl && new BigNumber(order.sz).isZero()) {
        throw new Error('Close-position TP/SL size cannot be modified.');
    }
    if (field === 'size' && !validateSize(value, szDecimals)) throw new Error('Enter a valid order size.');
    if (field === 'price') {
        if (order.orderType.includes('Market')) throw new Error('Market order prices cannot be modified.');
        if (!validatePerpsPriceInput(value, szDecimals) || new BigNumber(value).lte(0)) {
            throw new Error('Enter a valid order price.');
        }
    }

    return {
        oid: order.oid,
        order: {
            a: asset,
            b: order.side === 'B',
            p: field === 'price' ? value : order.limitPx,
            s: field === 'size' ? value : order.sz,
            r: order.reduceOnly,
            t: resolveOrderType(order),
            ...(order.cloid ? { c: order.cloid } : {}),
        },
    };
}
