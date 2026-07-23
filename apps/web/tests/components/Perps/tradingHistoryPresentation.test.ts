import { describe, expect, it } from 'vitest';

import { buildTradingHistoryFinancials } from '@/components/Perps/tradingHistoryPresentation.js';

describe('trading history financial presentation', () => {
    it('subtracts the fee from realized pnl for a closing fill', () => {
        const result = buildTradingHistoryFinancials({
            px: '77417',
            sz: '0.00046',
            closedPnl: '0.03',
            fee: '0.02',
        });

        expect(result.tradeValue.toFixed(4)).toBe('35.6118');
        expect(result.closedPnl.toFixed(2)).toBe('0.01');
        expect(result.closedPnlPercent.toFixed(2)).toBe('0.03');
    });

    it('uses the fee as the loss for an opening fill', () => {
        const result = buildTradingHistoryFinancials({
            px: '77350',
            sz: '0.00046',
            closedPnl: '0',
            fee: '0.02',
        });

        expect(result.closedPnl.toFixed(2)).toBe('-0.02');
        expect(result.closedPnlPercent.toFixed(2)).toBe('-0.06');
    });

    it('includes a maker rebate in net closed pnl', () => {
        const result = buildTradingHistoryFinancials({
            px: '100',
            sz: '1',
            closedPnl: '1',
            fee: '-0.01',
        });

        expect(result.closedPnl.toFixed(2)).toBe('1.01');
    });
});
