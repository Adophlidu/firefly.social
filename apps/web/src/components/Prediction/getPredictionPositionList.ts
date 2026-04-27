import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { unreachable } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';
import { getClosedPositions } from '@/providers/firefly/prediction/getClosedPositions.js';
import { getCurrentPositions } from '@/providers/firefly/prediction/getCurrentPositions.js';
import { getPredictionHistoryList } from '@/providers/firefly/prediction/getPredictionHistoryList.js';
import type { PolymarketPositionV2Data } from '@/providers/types/Firefly.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

interface Options {
    address: string;
    isProxyAddress?: boolean;
    limit?: number;
    indicator?: PageIndicator;
    eventId?: string;
    positionType?: 'current' | 'closed';
}

function mapV2ToUI(position: PolymarketPositionV2Data, isClosed: boolean): PredictionPositionDataForUI {
    // current position
    const isCurrent = 'redeemable' in position;
    const curPrice = position.curPrice ?? 0;
    const size = (isClosed ? position.totalBought : position.size) ?? 0;
    const avgPrice = position.avgPrice ?? 0;
    const totalBought = position.totalBought ?? 0;
    const pnl = (isCurrent ? position.cashPnl : position.realizedPnl) || 0;
    const pnlRate =
        isCurrent && position.percentPnl ? position.percentPnl / 100 : avgPrice ? pnl / (totalBought * avgPrice) : 0;

    return {
        Id: position.conditionId ?? '',
        IsClaim: isClosed,
        avg_price: avgPrice,
        closed_time: isClosed ? (position.timestamp ?? null) : null,
        conditionId: position.conditionId ?? '',
        cur_price: curPrice,
        current_value: isClosed ? avgPrice * totalBought + pnl : (position.currentValue ?? curPrice * size),
        event_slugs: position.eventSlug ? [position.eventSlug] : [],
        image: position.icon,
        is_closed: isClosed,
        isClaimable: position.redeemable ?? false,
        isWin: pnl > 0,
        marketSlug: position.slug ?? '',
        outcomeIndex: position.outcomeIndex,
        pnl,
        pnl_rate: pnlRate,
        resolvedResult: position.resolvedResult,
        shares: size,
        title: position.title,
        total_buy: totalBought,
        vote_status: position.outcome ?? '',
    };
}

export async function getPredictionPositionList(
    platform: PredictionPlatform,
    options: Options,
): Promise<Pageable<PredictionPositionDataForUI, PageIndicator>> {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const { positionType = 'current', address, indicator, limit, eventId } = options;
            const isClosed = positionType === 'closed';
            const fetcher = isClosed ? getClosedPositions : getCurrentPositions;
            const result = await fetcher({ address, indicator, limit, eventId });
            return {
                ...result,
                data: result.data.map((position) => mapV2ToUI(position, isClosed)),
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
                    outcomeIndex: position.offset,
                    total_buy: position.shares || 0,
                    current_value: (position.cur_price || 0) * (position.shares || 0),
                })),
            };
        }
        default:
            unreachable(platform);
    }
}
