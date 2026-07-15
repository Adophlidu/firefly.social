import type { Locale } from '@dimensiondev/enums';
import { PredictionPlatform } from '@dimensiondev/enums';
import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { unreachable } from '@dimensiondev/utils';

import { getClosedPositions } from '@/providers/firefly/prediction/getClosedPositions.js';
import { getCurrentPositions } from '@/providers/firefly/prediction/getCurrentPositions.js';
import { getPredictionHistoryList } from '@/providers/firefly/prediction/getPredictionHistoryList.js';
import { getRedeemablePositions } from '@/providers/firefly/prediction/getRedeemablePositions.js';
import type {
    PolymarketPositionV2Data,
    PolymarketV2PositionSortBy,
    PolymarketV2PositionSortDirection,
} from '@/providers/types/Firefly.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

interface Options {
    address: string;
    isProxyAddress?: boolean;
    limit?: number;
    indicator?: PageIndicator;
    eventId?: string;
    locale?: Locale;
    positionType?: 'current' | 'closed';
    sortBy?: PolymarketV2PositionSortBy;
    sortDirection?: PolymarketV2PositionSortDirection;
}

export function mapV2ToUI(position: PolymarketPositionV2Data, isClosed: boolean): PredictionPositionDataForUI {
    // current position
    const isCurrent = 'redeemable' in position;
    const curPrice = position.curPrice ?? 0;
    const size = (isClosed ? position.totalBought : position.size) ?? 0;
    const avgPrice = position.avgPrice ?? 0;
    const totalBought = position.totalBought ?? 0;
    const pnl = (isCurrent ? position.cashPnl : position.realizedPnl) || 0;
    const pnlRate = Math.max(
        -1,
        isCurrent && position.percentPnl ? position.percentPnl / 100 : avgPrice ? pnl / (totalBought * avgPrice) : 0,
    );

    return {
        Id: position.conditionId ?? '',
        IsClaim: isClosed,
        avg_price: avgPrice,
        closed_time: isClosed ? (position.timestamp ?? null) : null,
        endDate: position.endDate,
        endTime: position.endTime,
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
            const {
                positionType = 'current',
                address,
                indicator,
                limit,
                eventId,
                sortBy,
                sortDirection,
                locale,
            } = options;
            const isClosed = positionType === 'closed';

            if (isClosed) {
                const isFirstPage = !indicator?.id;
                const [redeemableResult, closedResult] = await Promise.all([
                    isFirstPage ? getRedeemablePositions({ address, eventId, locale }) : Promise.resolve([]),
                    getClosedPositions({ address, indicator, limit, eventId, sortBy, sortDirection, locale }),
                ]);

                const redeemableUI = redeemableResult.map((p) => mapV2ToUI(p, true));
                const closedUI = closedResult.data.map((p) => mapV2ToUI(p, true));

                // Deduplicate by conditionId (redeemable positions take priority)
                const seen = new Set<string>();
                const merged = [...redeemableUI, ...closedUI].filter((p) => {
                    if (seen.has(p.conditionId)) return false;
                    seen.add(p.conditionId);
                    return p.shares > 0;
                });

                // Client-side sort: align with wallet — TIMESTAMP DESC
                // For redeemable positions without closed_time, synthesize a timestamp
                // from endDate (end of that day) so they interleave with closed positions.
                const getTimestamp = (p: PredictionPositionDataForUI): number => {
                    if (p.closed_time) return p.closed_time;
                    if (p.endTime) {
                        const date = new Date(p.endTime);
                        if (!isNaN(date.getTime())) return Math.floor(date.getTime() / 1000);
                    }
                    if (p.endDate) {
                        const date = new Date(p.endDate);
                        if (!isNaN(date.getTime())) {
                            date.setHours(23, 59, 59, 0);
                            return Math.floor(date.getTime() / 1000);
                        }
                    }
                    return 0;
                };
                merged.sort((a, b) => getTimestamp(b) - getTimestamp(a));

                return {
                    ...closedResult,
                    data: merged,
                };
            }

            const result = await getCurrentPositions({ address, indicator, limit, eventId, locale });
            return {
                ...result,
                data: result.data.map((position) => mapV2ToUI(position, false)),
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
