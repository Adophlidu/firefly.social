import { BetsPriceTimeRange, PredictionPlatform } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { compact, first } from 'lodash-es';

import { getOpinionMarketPriceHistory } from '@/providers/firefly/prediction/getOpinionMarketPriceHistory.js';
import { getPriceHistory } from '@/providers/prediction/polymarket/getPriceHistory.js';
import type { PolymarketPriceHistory } from '@/providers/prediction/polymarket/type.js';
import type { OpinionPriceHistory } from '@/providers/types/Firefly.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface Options {
    markets: BetsMarketDataForUI[];
    timeRange: BetsPriceTimeRange;
    outcomeId: string;
    isSingleMarket?: boolean;
    endTime?: number;
    signal?: AbortSignal;
}

function formatOpinionTimeRange(timeRange: BetsPriceTimeRange) {
    switch (timeRange) {
        case BetsPriceTimeRange.OneDay:
            return { period: '5min', size: 288 };
        case BetsPriceTimeRange.OneWeek:
            return { period: '15min', size: 672 };
        case BetsPriceTimeRange.OneMonth:
            return { period: '1hour', size: 720 };
        case BetsPriceTimeRange.All:
            return { period: '1hour', size: 2000 };
        case BetsPriceTimeRange.OneHour:
        case BetsPriceTimeRange.SixHours:
            return { period: '', size: 0 };
        default:
            unreachable(timeRange);
    }
}

// The CLOB /prices-history endpoint returns an empty result when both startTs and
// endTs are supplied and their span exceeds 14 days. To fetch longer history
// (OneMonth / All), omit endTs — the API then returns startTs→now. This matches
// how Polymarket's own chart requests wide ranges.
const POLYMARKET_MAX_WINDOW_SEC = 14 * 86400;

export function formatPolymarketTimeRange(
    timeRange: BetsPriceTimeRange,
    createSec: number,
    endSec: number,
): {
    startTs?: number;
    endTs?: number;
    fidelity?: number;
} {
    // When the requested window exceeds the CLOB 14-day startTs+endTs limit, drop
    // endTs so the API returns the full startTs→now range instead of an empty set.
    const withOptionalEnd = (
        startTs: number,
        fidelity: number,
    ): { startTs: number; endTs?: number; fidelity: number } =>
        startTs < endSec - POLYMARKET_MAX_WINDOW_SEC ? { startTs, fidelity } : { startTs, endTs: endSec, fidelity };

    switch (timeRange) {
        case BetsPriceTimeRange.OneHour:
            return { startTs: Math.max(createSec, endSec - 3600), endTs: endSec, fidelity: 1 };
        case BetsPriceTimeRange.SixHours:
            return { startTs: Math.max(createSec, endSec - 21600), endTs: endSec, fidelity: 1 };
        case BetsPriceTimeRange.OneDay:
            return { startTs: Math.max(createSec, endSec - 86400), endTs: endSec, fidelity: 5 };
        case BetsPriceTimeRange.OneWeek:
            return { startTs: Math.max(createSec, endSec - 604800), endTs: endSec, fidelity: 30 };
        case BetsPriceTimeRange.OneMonth:
            // A 30-day window usually exceeds the 14d CLOB limit, so endTs is omitted
            // and the API returns the full month instead of being clamped to 14 days.
            return withOptionalEnd(Math.max(createSec, endSec - 2592000), 180);
        case BetsPriceTimeRange.All: {
            // Full history from market creation — NOT a trailing 14-day window. Match
            // Polymarket's MAX view (720-min buckets). Fall back to a 14-day trailing
            // window when createTime is unknown so we never request from epoch 0.
            const startTs = createSec > 0 ? createSec : endSec - POLYMARKET_MAX_WINDOW_SEC;
            return startTs < endSec - POLYMARKET_MAX_WINDOW_SEC
                ? { startTs, fidelity: 720 }
                : { startTs, endTs: endSec, fidelity: 60 };
        }
        default:
            return { startTs: Math.max(createSec, endSec - 86400), endTs: endSec, fidelity: 5 };
    }
}

function formatOpinionPricesData(questions: OpinionPriceHistory[], outcomeId: string) {
    const data = compact(
        questions.map((question) => {
            if (question.symbols.length !== 2) return null;

            const list = question.symbols[outcomeId === 'yes' ? 0 : 1].data.map((x) => ({
                id: x.id,
                time: x.id,
                price: x.open || '0',
                priceStr: `${Math.round(Number(x.open || '0') * 1000) / 10}%`,
                questionId: question.question_id,
            }));
            list.sort((a, b) => a.time - b.time);

            return list;
        }),
    );

    const maxLength = Math.max(...data.map((list) => list.length));
    const chartData = compact(
        Array.from({ length: maxLength }, (_, index) => {
            const time = data.find((list) => !!list[index]?.time)?.[index]?.time;
            if (!time) return null;

            return data.reduce<Record<string, string | number>>(
                (acc, list) => {
                    const item = index < list.length ? list[index] : null;
                    return {
                        ...acc,
                        ...(item ? { [item.questionId]: Number.isNaN(+item.price) ? 0 : +item.price } : {}),
                    };
                },
                {
                    time,
                },
            );
        }),
    );

    return chartData;
}
function formatPolymarketPricesData(
    data: Array<{
        market: BetsMarketDataForUI;
        history: PolymarketPriceHistory[];
    }>,
) {
    const maxLength = Math.max(...data.map(({ history }) => history.length));
    return compact(
        Array.from({ length: maxLength }, (_, index) => {
            const time = data.find(({ history }) => !!history[index]?.t)?.history[index]?.t;
            if (!time) return null;

            return data.reduce<Record<string, string | number>>(
                (acc, list) => {
                    const item = index < list.history.length ? list.history[index] : null;
                    return {
                        ...acc,
                        ...(item ? { [list.market.id]: item.p } : {}),
                    };
                },
                {
                    time,
                },
            );
        }),
    );
}

export async function getBetsMarketPriceHistory(
    platform: PredictionPlatform,
    { markets, timeRange, outcomeId, isSingleMarket, endTime, signal }: Options,
) {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const result = await Promise.all(
                markets.map(async (market) => {
                    const clobId = isSingleMarket
                        ? outcomeId || first(market.outcomes)?.id
                        : first(market.outcomes)?.id;
                    if (!clobId) return null;

                    const now = Math.floor(Date.now() / 1000);
                    const createSec = Math.floor((market.createTime ?? 0) / 1000);
                    const endSec =
                        market.closedTime && market.closedTime < Date.now()
                            ? Math.floor(market.closedTime / 1000)
                            : now;

                    return getPriceHistory({
                        market: clobId,
                        signal,
                        ...formatPolymarketTimeRange(timeRange, createSec, endSec),
                    });
                }),
            );
            return formatPolymarketPricesData(
                markets.map((market, index) => ({
                    market,
                    history: result[index]?.history || [],
                })),
            );
        }
        case PredictionPlatform.Opinion: {
            const createTime = dayjs(Math.min(...markets.map((m) => m.createTime))).unix();
            const { period, size } = formatOpinionTimeRange(timeRange);
            const endTime = dayjs().unix();
            const startTime =
                timeRange === BetsPriceTimeRange.All
                    ? createTime
                    : endTime - createTime < 24 * 3600
                      ? createTime
                      : endTime - 24 * 3600;
            const res = await getOpinionMarketPriceHistory({
                period,
                start_time: startTime,
                end_time: endTime,
                size,
                signal,
                question_ids: markets.map((m) => m.questionId),
            });
            return formatOpinionPricesData(res, outcomeId);
        }
        default:
            unreachable(platform);
    }
}
