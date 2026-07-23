import { BigNumber } from 'bignumber.js';

interface TradingHistoryFinancialsInput {
    px: string;
    sz: string;
    closedPnl: string;
    fee: string;
}

export function buildTradingHistoryFinancials(fill: TradingHistoryFinancialsInput) {
    const tradeValue = new BigNumber(fill.px).multipliedBy(fill.sz);
    const closedPnl = new BigNumber(fill.closedPnl || '0').minus(fill.fee || '0');
    const closedPnlPercent = tradeValue.isZero() ? new BigNumber(0) : closedPnl.dividedBy(tradeValue).multipliedBy(100);

    return { tradeValue, closedPnl, closedPnlPercent };
}
