import { formatAmount } from '@/helpers/formatAmount';
import type { OpenOrder } from '@/types/ui';

const EMPTY = '--';

/** Full-position TP/SL on HL uses zero size (see OneKey `SetTpslModal` tpOrder / slOrder). */
export function isFullPositionTpslSize(sz: string): boolean {
    return sz === '0.0' || sz === '0';
}

function formatTriggerPx(px: string): string {
    if (!px || px === '0') return EMPTY;
    return formatAmount(px, 4);
}

function applyPositionTpslOrder(pair: { tp: string; sl: string }, order: OpenOrder): { tp: string; sl: string } {
    if (!order.isPositionTpsl) return pair;
    let { tp, sl } = pair;
    if (order.orderType.startsWith('Take')) {
        tp = formatTriggerPx(order.triggerPx);
    }
    if (order.orderType.startsWith('Stop')) {
        sl = formatTriggerPx(order.triggerPx);
    }
    return { tp, sl };
}

export interface PositionTpSlDisplay {
    tp: string;
    sl: string;
    /** OneKey: non–position TP/SL orders exist but no `isPositionTpsl` trigger prices to show — link to open orders. */
    showViewOrders: boolean;
}

interface Accumulator {
    tp: string;
    sl: string;
    hasNonPositionTpsl: boolean;
}

/** TP/SL trigger display for one coin (OneKey-style: isPositionTpsl + Take/Stop prefixes). */
export function getPositionTpSlFromOpenOrders(openOrders: OpenOrder[], coin: string): { tp: string; sl: string } {
    const row = buildPositionTpSlByCoin(openOrders).get(coin);
    return { tp: row?.tp ?? EMPTY, sl: row?.sl ?? EMPTY };
}

/**
 * Map coin → TP/SL display for position cards (OneKey `PositionRowDesktopTPSL` parity).
 * `showViewOrders` when there is at least one non–`isPositionTpsl` order for the coin but
 * no position TP/SL trigger prices resolved to non-empty values.
 */
export function buildPositionTpSlByCoin(openOrders: OpenOrder[]): ReadonlyMap<string, PositionTpSlDisplay> {
    const map = new Map<string, Accumulator>();

    for (const order of openOrders) {
        const cur: Accumulator = map.get(order.coin) ?? {
            tp: EMPTY,
            sl: EMPTY,
            hasNonPositionTpsl: false,
        };

        if (order.isPositionTpsl) {
            const { tp, sl } = applyPositionTpslOrder({ tp: cur.tp, sl: cur.sl }, order);
            map.set(order.coin, { tp, sl, hasNonPositionTpsl: cur.hasNonPositionTpsl });
        } else {
            map.set(order.coin, { ...cur, hasNonPositionTpsl: true });
        }
    }

    const out = new Map<string, PositionTpSlDisplay>();
    for (const [coin, cur] of map) {
        out.set(coin, {
            tp: cur.tp,
            sl: cur.sl,
            showViewOrders: cur.hasNonPositionTpsl && cur.tp === EMPTY && cur.sl === EMPTY,
        });
    }

    return out;
}

/** Full-position TP/SL orders for cancel / sheet (OneKey: Take/Stop + isPositionTpsl + sz 0.0). */
export function findFullPositionTpslOrders(
    openOrders: OpenOrder[],
    coin: string,
): { tpOrder: OpenOrder | null; slOrder: OpenOrder | null } {
    let tpOrder: OpenOrder | null = null;
    let slOrder: OpenOrder | null = null;

    for (const order of openOrders) {
        if (order.coin !== coin || !order.isPositionTpsl || !isFullPositionTpslSize(order.sz)) continue;

        if (order.orderType.startsWith('Take') && !tpOrder) {
            tpOrder = order;
        }
        if (order.orderType.startsWith('Stop') && !slOrder) {
            slOrder = order;
        }
    }

    return { tpOrder, slOrder };
}
