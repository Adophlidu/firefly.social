import { BetsPriceTimeRange, PredictionPlatform } from '@dimensiondev/enums';
import { safeUnreachable, unreachable } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { compact, first } from 'lodash-es';

import { getOpinionMarketPriceHistory } from '@/providers/firefly/prediction/getOpinionMarketPriceHistory.js';
import { getPriceHistory } from '@/providers/prediction/polymarket/getPriceHistory.js';
import type { PolymarketPriceHistory, PriceHistoryInterval } from '@/providers/prediction/polymarket/type.js';
import type { OpinionPriceHistory } from '@/providers/types/Firefly.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface Options {
    markets: BetsMarketDataForUI[];
    timeRange: BetsPriceTimeRange;
    outcomeId: string;
    isSingleMarket?: boolean;
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
function formatPolymarketTimeRange(
    timeRange: BetsPriceTimeRange,
    createTime: number,
): {
    fidelity?: number;
    interval?: PriceHistoryInterval;
} {
    const days = dayjs().diff(createTime, 'day');
    const hours = dayjs().diff(createTime, 'hour');

    let diffMaxRange: BetsPriceTimeRange | null;
    if (days >= 30) {
        diffMaxRange = BetsPriceTimeRange.OneMonth;
    } else if (days >= 7) {
        diffMaxRange = BetsPriceTimeRange.OneWeek;
    } else if (days >= 1) {
        diffMaxRange = BetsPriceTimeRange.OneDay;
    } else if (hours >= 6) {
        diffMaxRange = BetsPriceTimeRange.SixHours;
    } else if (hours >= 1) {
        diffMaxRange = BetsPriceTimeRange.OneHour;
    } else {
        diffMaxRange = null;
    }

    let fidelity: number | undefined;
    let interval: PriceHistoryInterval | undefined;
    if (!!diffMaxRange && timeRange <= diffMaxRange) {
        switch (timeRange) {
            case BetsPriceTimeRange.OneHour: {
                interval = '1h';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.SixHours: {
                interval = '6h';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.OneDay: {
                interval = '1d';
                fidelity = 5;
                break;
            }
            case BetsPriceTimeRange.OneWeek: {
                interval = '1w';
                fidelity = 30;
                break;
            }
            case BetsPriceTimeRange.OneMonth: {
                interval = '1m';
                fidelity = 180;
                break;
            }
            case BetsPriceTimeRange.All: {
                interval = 'max';
                fidelity = 720;
                break;
            }
            default:
                safeUnreachable(timeRange);
                break;
        }
    } else {
        switch (diffMaxRange) {
            case BetsPriceTimeRange.OneHour: {
                interval = '6h';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.SixHours: {
                interval = '1d';
                fidelity = 1;
                break;
            }
            case BetsPriceTimeRange.OneDay: {
                interval = '1w';
                fidelity = 5;
                break;
            }
            case BetsPriceTimeRange.OneWeek: {
                interval = '1m';
                fidelity = 30;
                break;
            }
            case BetsPriceTimeRange.OneMonth: {
                interval = 'max';
                fidelity = 720;
                break;
            }
            default: {
                interval = '1h';
                fidelity = 1;
                break;
            }
        }
    }

    return { interval, fidelity };
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
    { markets, timeRange, outcomeId, isSingleMarket, signal }: Options,
) {
    switch (platform) {
        case PredictionPlatform.Polymarket: {
            const result = await Promise.all(
                markets.map(async (market) => {
                    const clobId = isSingleMarket
                        ? outcomeId || first(market.outcomes)?.id
                        : first(market.outcomes)?.id;
                    if (!clobId) return null;

                    return getPriceHistory({
                        market: clobId,
                        signal,
                        ...formatPolymarketTimeRange(timeRange, market.createTime),
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
