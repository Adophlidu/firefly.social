import type { PolymarketSharePositionStatus } from '@/helpers/polymarketShareImage.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

export interface PositionShareMetrics {
    status: PolymarketSharePositionStatus;
    /** Return relative to cost, as a percentage. */
    pnlRate: number;
    totalCost: number;
    avgPrice: number;
    currentPnl: number;
}

/**
 * Derives the share-card PnL metrics from an authoritative position. A closed position's rate is the
 * realized `pnl / totalTrade` (clamped at −100%, a full loss); an open position's is the server's
 * unrealized `pnl_rate`. Single source of truth for the position-cell share (`getPositionShareImagePayload`)
 * and the timeline-activity override (`resolveActivityShareOverrides`, FW-7848), so both surfaces show
 * the same numbers as the wallet.
 */
export function computePositionShareMetrics(position: PredictionPositionDataForUI): PositionShareMetrics {
    if (position.is_closed) {
        const totalBought = position.total_buy || position.shares;
        const totalTrade = position.avg_price * totalBought;
        const pnlRate = Math.max(-1, totalTrade > 0 ? position.pnl / totalTrade : position.pnl_rate) * 100;
        return {
            status: position.pnl > 0 ? 'won' : 'lost',
            pnlRate,
            totalCost: totalTrade,
            avgPrice: position.avg_price,
            currentPnl: position.pnl,
        };
    }

    return {
        status: 'active',
        pnlRate: position.pnl_rate * 100,
        totalCost: position.avg_price * position.shares,
        avgPrice: position.avg_price,
        currentPnl: position.pnl,
    };
}
