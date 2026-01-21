import { NotImplementedError, unreachable } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';
import { getPolymarketUserCurrentPositions } from '@/providers/prediction/polymarket/getPolymarketUserCurrentPositions.js';
import type { PolymarketUserPosition } from '@/providers/prediction/polymarket/type.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

interface Options {
    wallet: string;
    marketIds: string[];
}

function formatPolymarketPosition(position: PolymarketUserPosition): PredictionPositionDataForUI {
    return {
        title: position.title,
        vote_status: position.outcome,
        event_slugs: [position.eventSlug],
        marketSlug: position.slug,
        Id: position.conditionId,
        image: position.icon,
        shares: position.size,
        avg_price: position.avgPrice,
        cur_price: position.curPrice,
        pnl: position.cashPnl,
        pnl_rate: position.percentPnl / 100,
        total_buy: position.totalBought,
        IsClaim: false,
        is_closed: false,
        conditionId: position.conditionId,
        isClaimable: position.redeemable,
        isWin: position.currentValue !== 0,
        outcomeIndex: position.outcomeIndex,
    };
}

export async function getUserCurrentPositions(
    platform: PredictionPlatform,
    options: Options,
): Promise<PredictionPositionDataForUI[]> {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            const positions = await getPolymarketUserCurrentPositions({
                user: options.wallet,
                market: options.marketIds,
            });
            return positions.map(formatPolymarketPosition);
        case PredictionPlatform.Opinion:
            throw new NotImplementedError();
        default:
            unreachable(platform);
    }
}
