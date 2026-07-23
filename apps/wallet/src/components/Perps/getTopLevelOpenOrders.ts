import type { FrontendOpenOrdersResponse } from '@nktkas/hyperliquid/api/info';

type OpenOrder = FrontendOpenOrdersResponse[number];

function getChildOrderId(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'object') return;
    if ('oid' in value && typeof value.oid === 'number') return value.oid;
    if ('order' in value) return getChildOrderId(value.order);
    return;
}

export function getTopLevelOpenOrders(orders: FrontendOpenOrdersResponse): OpenOrder[] {
    const childOrderIds = new Set(
        orders.flatMap((order) => order.children.flatMap((child) => getChildOrderId(child) ?? [])),
    );
    return orders.filter((order) => !childOrderIds.has(order.oid));
}
