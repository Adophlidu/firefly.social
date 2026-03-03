import { parseJson, safeUnreachable } from '@dimensiondev/utils';
import { first, last } from 'lodash-es';
import urlcat from 'urlcat';

import { BetsMarketResolveStatus, PredictionPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getPolymarketEvent } from '@/providers/prediction/polymarket/getEvent.js';
import { type PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import { type OpinionMarketDetail, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import { type BetsEventDataForUI, type BetsMarketDataForUI } from '@/types/prediction.js';

export async function getOpinionMarketDetail(topicId: string, isMutil: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/opinion/market/detail', {
        topicId,
        isMutil: isMutil ? 1 : 0,
    });
    const response = await fireflySessionHolder.fetchWithoutSession<
        Response<{
            errmsg: string;
            errno: number;
            result: {
                data: OpinionMarketDetail;
            };
        }>
    >(url);
    const data = resolveFireflyResponseData(response);
    if (data?.errno !== 0 || !data.result?.data) {
        throw new Error(data?.errmsg || 'Failed to fetch opinion market detail');
    }

    return data?.result?.data;
}

interface Options {
    id: string;
    isMutil: boolean;
}

function sortMarkets(markets: BetsMarketDataForUI[]) {
    return [
        ...markets.filter((market) => !market.isResolved && !market.isClosed),
        ...markets.filter((market) => market.isResolved || market.isClosed),
    ];
}

function filterAndSortPolymarketMarkets(detail: PolymarketEvent) {
    const markets = (detail.markets || []).filter((market) => market.active);
    try {
        if (detail.sortBy === 'price') {
            markets.sort((a, b) => {
                const aPrices = parseJson<string[]>(a.outcomePrices);
                const bPrices = parseJson<string[]>(b.outcomePrices);
                const aPrice = first(aPrices) || '0';
                const bPrice = first(bPrices) || '0';
                return parseFloat(bPrice) - parseFloat(aPrice);
            });
        } else {
            markets.sort((a, b) => {
                const aThreshold = a.groupItemThreshold || '0';
                const bThreshold = b.groupItemThreshold || '0';
                return parseFloat(aThreshold) - parseFloat(bThreshold);
            });
        }

        return markets;
    } catch {
        return markets;
    }
}

function formatPolymarketEvent(detail: PolymarketEvent): BetsEventDataForUI {
    const markets: BetsMarketDataForUI[] = filterAndSortPolymarketMarkets(detail).map((market) => {
        const outcomeLabels = parseJson<string[]>(market.outcomes);
        const outcomeIds = parseJson<string[]>(market.clobTokenIds);
        const prices = parseJson<string[]>(market.outcomePrices);
        const isResolved = market.umaResolutionStatus === BetsMarketResolveStatus.Resolved;
        const outcomes = (outcomeLabels || []).map((x, i) => ({
            id: outcomeIds?.[i] || '',
            label: x,
            price: prices?.[i] || '0',
        }));
        const statusList: BetsMarketResolveStatus[] = [];
        const statuses = parseJson<BetsMarketResolveStatus[]>(market.umaResolutionStatuses || '[]');
        if (statuses && Array.isArray(statuses)) {
            statusList.push(
                ...statuses.filter((s) =>
                    [
                        BetsMarketResolveStatus.Proposed,
                        BetsMarketResolveStatus.Disputed,
                        BetsMarketResolveStatus.Resolved,
                    ].includes(s),
                ),
            );
            if (isResolved) {
                if (!statusList.includes(BetsMarketResolveStatus.Disputed) && statuses.length > 0) {
                    statusList.splice(1, 0, BetsMarketResolveStatus.NoDisputed);
                }
                if (last(statusList) !== BetsMarketResolveStatus.Resolved) {
                    statusList.push(BetsMarketResolveStatus.Resolved);
                }
            }
            if (last(statusList) === BetsMarketResolveStatus.Disputed && !isResolved) {
                statusList.push(BetsMarketResolveStatus.Review);
            }
        }

        return {
            id: market.id,
            slug: market.slug,
            questionId: market.id,
            volume: market.volume,
            title: market.groupItemTitle || market.question,
            isResolved,
            resolvedOutcomeId:
                isResolved && outcomes?.length === 2
                    ? parseFloat(outcomes[0].price) >= parseFloat(outcomes[1].price)
                        ? outcomes[0].id
                        : outcomes[1].id
                    : undefined,
            isClosed: !!market.closed,
            createTime: new Date(market.startDate || market.createdAt).getTime(),
            image: market.image,
            conditionId: market.conditionId,
            outcomes,
            statusList,
            bestAsk: market.bestAsk,
            bestBid: market.bestBid,
        };
    });

    return {
        id: detail.id,
        title: detail.title,
        image: detail.image,
        status: detail.active ? 'active' : 'ended',
        platform: PredictionPlatform.Polymarket,
        description: detail.description,
        isSingleEvent: detail.markets?.length === 0,
        tags: detail.tags.map((tag) => tag),
        endTime: new Date(detail.endDate).getTime(),
        volume: detail.volume,
        markets: sortMarkets(markets),
    };
}

function formatOpinionMarket(detail: OpinionMarketDetail): BetsEventDataForUI {
    const markets: BetsMarketDataForUI[] = (detail.childList || []).map((market) => {
        const isResolved = market.status === 4;

        return {
            id: `${market.topicId}`,
            questionId: market.questionId,
            conditionId: market.conditionId,
            title: market.title,
            image: market.thumbnailUrl,
            volume: market.volume,
            isResolved,
            isClosed: false,
            resolvedOutcomeId:
                isResolved && market.resultPos
                    ? market.resultPos === market.yesPos
                        ? 'yes'
                        : market.resultPos === market.noPos
                          ? 'no'
                          : undefined
                    : undefined,
            createTime: market.createTime * 1000,
            outcomes: [
                { id: 'yes', label: market.yesLabel || 'YES', price: market.yesMarketPrice || '0' },
                { id: 'no', label: market.noLabel || 'NO', price: market.noMarketPrice || '0' },
            ],
        };
    });

    return {
        id: detail.questionId,
        title: detail.title,
        image: detail.thumbnailUrl,
        status: 'active',
        description: detail.rules,
        platform: PredictionPlatform.Opinion,
        endTime: detail.cutoffTime * 1000,
        volume: detail.volume,
        isSingleEvent: markets.length === 0,
        markets: markets.length
            ? sortMarkets(markets)
            : [
                  {
                      id: `${detail.topicId}`,
                      questionId: detail.questionId,
                      conditionId: detail.conditionId,
                      title: detail.title,
                      image: detail.thumbnailUrl,
                      volume: detail.volume,
                      isResolved: detail.status === 4,
                      isClosed: false,
                      createTime: detail.createTime * 1000,
                      outcomes: [
                          { id: 'yes', label: detail.yesLabel || 'YES', price: detail.yesMarketPrice || '0' },
                          { id: 'no', label: detail.noLabel || 'NO', price: detail.noMarketPrice || '0' },
                      ],
                  },
              ],
    };
}

export async function getEventDetail(
    platform: PredictionPlatform,
    { id, isMutil }: Options,
): Promise<BetsEventDataForUI | null> {
    switch (platform) {
        case PredictionPlatform.Opinion: {
            const detail = await getOpinionMarketDetail(id, isMutil);
            return detail ? formatOpinionMarket(detail) : null;
        }
        case PredictionPlatform.Polymarket: {
            const detail = await getPolymarketEvent({ slug: id });
            return detail ? formatPolymarketEvent(detail) : null;
        }
        default:
            safeUnreachable(platform);
            return null;
    }
}
