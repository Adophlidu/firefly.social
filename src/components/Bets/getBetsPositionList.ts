import { unreachable } from '@dimensiondev/utils';

import { BetsPlatform } from '@/constants/enum.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import { getBetsHistoryList } from '@/providers/firefly/bets/getBetsHistoryList.js';
import { getPositionHistory } from '@/providers/firefly/bets/getPositionHistory.js';
import type { BetsPositionDataForUI } from '@/types/bets.js';

interface Options {
    address: string;
    isProxyAddress?: boolean;
    limit?: number;
    indicator?: PageIndicator;
    isClaim?: boolean;
}

export async function getBetsPositionList(
    platform: BetsPlatform,
    options: Options,
): Promise<Pageable<BetsPositionDataForUI, PageIndicator>> {
    switch (platform) {
        case BetsPlatform.Polymarket:
            return getPositionHistory(options);
        case BetsPlatform.Opinion: {
            const result = await getBetsHistoryList({
                wallet: options.address,
                is_proxy: options.isProxyAddress ?? false,
                limit: options.limit,
                indicator: options.indicator,
                platform: BetsPlatform.Opinion,
            });

            return {
                ...result,
                data: result.data.map<BetsPositionDataForUI>((position) => ({
                    ...position,
                    event_slugs: [],
                    Id: position.conditionId,
                    IsClaim: false,
                    is_closed: false,
                    pnl: position.notfill_pnl,
                    pnl_rate: position.pnl_rate,
                    total_buy: 0,
                })),
            };
        }
        default:
            unreachable(platform);
    }
}
