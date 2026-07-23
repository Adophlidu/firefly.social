export type OrderBookUnit = 'USDC' | 'coin';

export interface OrderBookLevel {
    px: string;
    sz: string;
}

export interface OrderBookRow extends OrderBookLevel {
    size: number;
    total: number;
    ratio: number;
}

function levelSize(level: OrderBookLevel, unit: OrderBookUnit) {
    const size = Number(level.sz);
    return unit === 'USDC' ? Number(level.px) * size : size;
}

function cumulativeTotals(rows: OrderBookLevel[], side: 'ask' | 'bid', unit: OrderBookUnit) {
    const totals = Array.from<number>({ length: rows.length }).fill(0);
    let cumulative = 0;

    if (side === 'ask') {
        for (let index = rows.length - 1; index >= 0; index -= 1) {
            cumulative += levelSize(rows[index]!, unit);
            totals[index] = cumulative;
        }
    } else {
        for (let index = 0; index < rows.length; index += 1) {
            cumulative += levelSize(rows[index]!, unit);
            totals[index] = cumulative;
        }
    }

    return totals;
}

export function buildOrderBookPresentation(asks: OrderBookLevel[], bids: OrderBookLevel[], unit: OrderBookUnit) {
    const askTotals = cumulativeTotals(asks, 'ask', unit);
    const bidTotals = cumulativeTotals(bids, 'bid', unit);
    const maxTotal = Math.max(...askTotals, ...bidTotals, Number.EPSILON);
    const toRows = (rows: OrderBookLevel[], totals: number[]): OrderBookRow[] =>
        rows.map((level, index) => ({
            ...level,
            size: levelSize(level, unit),
            total: totals[index]!,
            ratio: totals[index]! / maxTotal,
        }));
    const bestAsk = Number(asks.at(-1)?.px);
    const bestBid = Number(bids[0]?.px);
    const spread = bestAsk - bestBid;

    return {
        asks: toRows(asks, askTotals),
        bids: toRows(bids, bidTotals),
        spread: Number.isFinite(spread) ? spread : undefined,
        spreadPercent: Number.isFinite(spread) && bestBid ? (spread / bestBid) * 100 : undefined,
    };
}

export function getOrderBookStepOptions(referencePrice: number) {
    if (!Number.isFinite(referencePrice) || referencePrice <= 0) return [];
    const baseStep = 10 ** (Math.floor(Math.log10(referencePrice)) - 4);
    return [1, 2, 5, 10, 100, 1000].map((multiplier, stepIndex) => ({
        stepIndex,
        label: (baseStep * multiplier).toLocaleString('en-US', {
            maximumFractionDigits: 8,
            useGrouping: false,
        }),
    }));
}

export function getOrderBookRetryDelay(attempt: number) {
    return Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt));
}
