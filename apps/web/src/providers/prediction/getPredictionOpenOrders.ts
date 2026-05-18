import { PredictionPlatform } from '@dimensiondev/enums';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { NotImplementedError, unreachable } from '@dimensiondev/utils';

import { getPolymarketOpenOrders } from '@/providers/firefly/prediction/getPolymarketOpenOrders.js';
import type { PredictionOpenOrder } from '@/types/prediction.js';

interface Options {
    platform: PredictionPlatform;
    indicator?: PageIndicator;
}

export async function getPredictionOpenOrders({
    platform,
    indicator,
}: Options): Promise<Pageable<PredictionOpenOrder, PageIndicator>> {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return getPolymarketOpenOrders(indicator);
        case PredictionPlatform.Opinion:
            throw new NotImplementedError('getPredictionOpenOrders for Opinion is not implemented yet.');
        default:
            unreachable(platform);
    }
}
