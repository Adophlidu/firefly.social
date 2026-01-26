import { unreachable } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';
import { type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { getPositionHistory } from '@/providers/firefly/prediction/getPositionHistory.js';
import { getPredictionHistoryList } from '@/providers/firefly/prediction/getPredictionHistoryList.js';
import { type PredictionPositionDataForUI } from '@/types/prediction.js';

interface Options {
    address: string;
    isProxyAddress?: boolean;
    limit?: number;
    indicator?: PageIndicator;
    isClaim?: boolean;
}

export async function getPredictionPositionList(
    platform: PredictionPlatform,
    options: Options,
): Promise<Pageable<PredictionPositionDataForUI, PageIndicator>> {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const result = await getPositionHistory(options);
            return {
                ...result,
                data: result.data.map((item) => ({
                    ...item,
                    outcomeIndex: item.offset,
                })),
            };
        }
        case PredictionPlatform.Opinion: {
            const result = await getPredictionHistoryList({
                wallet: options.address,
                is_proxy: options.isProxyAddress ?? false,
                limit: options.limit,
                indicator: options.indicator,
                platform: PredictionPlatform.Opinion,
            });

            return {
                ...result,
                data: result.data.map<PredictionPositionDataForUI>((position) => ({
                    ...position,
                    event_slugs: [],
                    Id: position.conditionId,
                    IsClaim: false,
                    is_closed: false,
                    pnl: position.notfill_pnl,
                    pnl_rate: position.pnl_rate,
                    total_buy: (position.cur_price || 0) * (position.shares || 0),
                })),
            };
        }
        default:
            unreachable(platform);
    }
}
