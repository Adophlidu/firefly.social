import { describe, expect, it } from 'vitest';

import { computePositionShareMetrics } from '@/helpers/prediction/polymarket/computePositionShareMetrics.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

function position(overrides: Partial<PredictionPositionDataForUI>): PredictionPositionDataForUI {
    return {
        Id: 'id',
        IsClaim: false,
        avg_price: 0.5,
        closed_time: null,
        conditionId: '0xabc',
        cur_price: 0.6,
        current_value: 60,
        event_slugs: ['evt'],
        image: '',
        is_closed: false,
        isClaimable: false,
        isWin: true,
        marketSlug: 'mkt',
        outcomeIndex: 0,
        pnl: 10,
        pnl_rate: 0.2,
        shares: 100,
        title: 'Market',
        total_buy: 100,
        vote_status: 'Yes',
        ...overrides,
    } as PredictionPositionDataForUI;
}

describe('computePositionShareMetrics', () => {
    it('uses the server unrealized pnl_rate for an open position (×100)', () => {
        const metrics = computePositionShareMetrics(position({ is_closed: false, pnl_rate: 0.2, pnl: 10 }));
        expect(metrics.status).toBe('active');
        expect(metrics.pnlRate).toBeCloseTo(20);
        expect(metrics.currentPnl).toBe(10);
        expect(metrics.totalCost).toBeCloseTo(50); // avg_price * shares = 0.5 * 100
    });

    it('derives the realized rate from pnl/totalTrade for a won closed position', () => {
        const metrics = computePositionShareMetrics(
            position({ is_closed: true, avg_price: 0.5, total_buy: 100, pnl: 25 }),
        );
        expect(metrics.status).toBe('won');
        expect(metrics.totalCost).toBeCloseTo(50); // 0.5 * 100
        expect(metrics.pnlRate).toBeCloseTo(50); // 25 / 50 * 100
        expect(metrics.currentPnl).toBe(25);
    });

    it('clamps a full loss at -100% and marks it lost', () => {
        const metrics = computePositionShareMetrics(
            position({ is_closed: true, avg_price: 0.5, total_buy: 100, pnl: -50 }),
        );
        expect(metrics.status).toBe('lost');
        expect(metrics.pnlRate).toBe(-100);
    });

    it('marks a break-even closed position as lost', () => {
        const metrics = computePositionShareMetrics(
            position({ is_closed: true, avg_price: 0.5, total_buy: 100, pnl: 0 }),
        );
        expect(metrics.status).toBe('lost');
    });

    it('falls back to pnl_rate when totalTrade is zero for a closed position', () => {
        const metrics = computePositionShareMetrics(
            position({ is_closed: true, avg_price: 0, total_buy: 0, shares: 0, pnl: 5, pnl_rate: 0.3 }),
        );
        expect(metrics.pnlRate).toBeCloseTo(30);
    });
});
