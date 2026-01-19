import { NotImplementedError, safeUnreachable } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';
import { getPolymarketMarketPrice } from '@/providers/prediction/polymarket/getPolymarketMarketPrice.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface Options {
    market: BetsMarketDataForUI;
    side?: 'buy' | 'sell';
}

export async function getBetsMarketPrice(
    platform: PredictionPlatform,
    { market, side = 'buy' }: Options,
): Promise<Array<{ outcomeId: string; price: string | null }>> {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const upperCaseSide = side.toUpperCase() as 'BUY' | 'SELL';
            const result = await getPolymarketMarketPrice({
                data: market.outcomes.map((outcome) => ({
                    token_id: outcome.id,
                    side: upperCaseSide,
                })),
            });
            return market.outcomes.map((outcome) => ({
                outcomeId: outcome.id,
                price: result?.[outcome.id]?.[upperCaseSide] ?? null,
            }));
        }
        case PredictionPlatform.Opinion:
            throw new NotImplementedError('getBetsMarketPrice for Opinion');
        default:
            safeUnreachable(platform);
            return [];
    }
}
