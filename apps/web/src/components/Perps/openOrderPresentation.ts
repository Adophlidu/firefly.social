export interface OpenOrderPresentationInput {
    oid?: number;
    side: 'A' | 'B';
    limitPx: string;
    sz: string;
    origSz: string;
    triggerPx: string;
    children?: unknown[];
    isPositionTpsl?: boolean;
    reduceOnly: boolean;
    orderType: 'Market' | 'Limit' | 'Stop Market' | 'Stop Limit' | 'Take Profit Market' | 'Take Profit Limit';
}

interface TpslChildOrder {
    oid?: number;
    triggerPx: string;
    orderType: OpenOrderPresentationInput['orderType'];
}

function parseTpslChildOrder(value: unknown): TpslChildOrder | undefined {
    if (!value || typeof value !== 'object') return;
    const candidate = 'order' in value && value.order && typeof value.order === 'object' ? value.order : value;
    if (!('orderType' in candidate) || !('triggerPx' in candidate)) return;
    if (typeof candidate.orderType !== 'string' || typeof candidate.triggerPx !== 'string') return;
    if (!candidate.orderType.startsWith('Take Profit') && !candidate.orderType.startsWith('Stop')) return;
    return {
        oid: 'oid' in candidate && typeof candidate.oid === 'number' ? candidate.oid : undefined,
        triggerPx: candidate.triggerPx,
        orderType: candidate.orderType as TpslChildOrder['orderType'],
    };
}

function getTpslChildren(order: OpenOrderPresentationInput) {
    return (order.children ?? []).map(parseTpslChildOrder).filter((child) => child !== undefined);
}

export function getOpenOrderChildIds(order: OpenOrderPresentationInput) {
    return getTpslChildren(order).flatMap((child) => child.oid ?? []);
}

export type OpenOrderDirection = 'long' | 'short' | 'close-long' | 'close-short';

export function getOpenOrderDirection(order: OpenOrderPresentationInput): OpenOrderDirection {
    if (!order.reduceOnly) return order.side === 'B' ? 'long' : 'short';
    return order.side === 'B' ? 'close-short' : 'close-long';
}

export function getOpenOrderPresentation(
    order: OpenOrderPresentationInput,
    { isAttachedChild = false }: { isAttachedChild?: boolean } = {},
) {
    const isMarket = order.orderType.includes('Market');
    const originalSize = Number(order.origSz);
    const remainingSize = Number(order.sz);
    const isClosePosition = order.isPositionTpsl === true && Number.isFinite(remainingSize) && remainingSize === 0;
    const limitPrice = Number(order.limitPx);
    const filled = isClosePosition ? undefined : Math.max(originalSize - remainingSize, 0);
    const value = isClosePosition || isMarket ? undefined : originalSize * limitPrice;
    const tpslChildren = getTpslChildren(order);
    const takeProfitChild = tpslChildren.find((child) => child.orderType.startsWith('Take Profit'));
    const stopLossChild = tpslChildren.find((child) => child.orderType.startsWith('Stop'));
    const ownTakeProfit = !isAttachedChild && order.orderType.startsWith('Take Profit') ? order.triggerPx : undefined;
    const ownStopLoss = !isAttachedChild && order.orderType.startsWith('Stop') ? order.triggerPx : undefined;

    return {
        direction: getOpenOrderDirection(order),
        isClosePosition,
        canEditSize: !isClosePosition,
        filled: Number.isFinite(filled) ? filled : undefined,
        value: Number.isFinite(value) ? value : undefined,
        price: isMarket ? undefined : order.limitPx,
        takeProfit: takeProfitChild?.triggerPx ?? ownTakeProfit,
        stopLoss: stopLossChild?.triggerPx ?? ownStopLoss,
    };
}
