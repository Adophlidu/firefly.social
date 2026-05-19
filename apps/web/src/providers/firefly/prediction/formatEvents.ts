import { BetsMarketResolveStatus, PredictionPlatform } from '@dimensiondev/enums';
import { parseJson } from '@dimensiondev/utils';
import { first, last } from 'lodash-es';

import { resolveCryptoFromPolymarketEvent } from '@/providers/firefly/prediction/resolveCryptoFromPolymarketEvent.js';
import { getPredictionRecurrenceFromPolymarketEvent } from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import type { OpinionMarketDetail } from '@/providers/types/Firefly.js';
import { type BetsEventDataForUI, type BetsMarketDataForUI, PredictionRecurrence } from '@/types/prediction.js';

function filterAndSortPolymarketMarkets(detail: PolymarketEvent) {
    const markets = (detail.markets || []).filter((market) => market.active);
    try {
        if (detail.sortBy === 'price') {
            markets.sort((a, b) => {
                const aPrices = parseJson<string[]>(a.outcomePrices);
                const bPrices = parseJson<string[]>(b.outcomePrices);
                const aPrice = first(aPrices) || '0';
                const bPrice = first(bPrices) || '0';
                return Number.parseFloat(bPrice) - Number.parseFloat(aPrice);
            });
        } else {
            markets.sort((a, b) => {
                const aThreshold = a.groupItemThreshold || '0';
                const bThreshold = b.groupItemThreshold || '0';
                return Number.parseFloat(aThreshold) - Number.parseFloat(bThreshold);
            });
        }

        return markets;
    } catch {
        return markets;
    }
}

function sortMarkets(markets: BetsMarketDataForUI[]) {
    return [
        ...markets.filter((market) => !market.isResolved && !market.isClosed),
        ...markets.filter((market) => market.isResolved || market.isClosed),
    ];
}

function fixRecurrence(recurrence: PredictionRecurrence, startTime?: string, endDate?: string) {
    if (!startTime || !endDate) return recurrence;

    if (recurrence !== PredictionRecurrence.Daily) return recurrence;

    const diff = new Date(endDate).getTime() - new Date(startTime).getTime();
    const diffHours = diff / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays < 1 && diffHours === 4) return PredictionRecurrence.FourHours;

    return recurrence;
}

export function formatPolymarketEvent(detail: PolymarketEvent): BetsEventDataForUI {
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
                    ? Number.parseFloat(outcomes[0].price) >= Number.parseFloat(outcomes[1].price)
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

    const cryptoName = resolveCryptoFromPolymarketEvent(detail);
    const eventStartTime = first(detail.markets)?.eventStartTime;

    return {
        id: detail.id,
        slug: detail.slug,
        title: detail.title,
        image: detail.image,
        status: detail.active ? 'active' : 'ended',
        platform: PredictionPlatform.Polymarket,
        description: detail.description,
        isSingleEvent: detail.markets?.length === 0,
        tags: detail.tags,
        endTime: new Date(detail.endDate).getTime(),
        volume: detail.volume,
        markets: sortMarkets(markets),
        startTime: eventStartTime || detail.startTime || detail.startDate,
        endDate: detail.endDate,
        closed: detail.closed,
        archived: detail.archived,
        cryptoData:
            cryptoName &&
            detail.series?.some((s) =>
                [
                    PredictionRecurrence.FiveMinutes,
                    PredictionRecurrence.FifteenMinutes,
                    PredictionRecurrence.FourHours,
                    PredictionRecurrence.Daily,
                    PredictionRecurrence.Hour,
                ].includes(s.recurrence),
            )
                ? {
                      name: cryptoName,
                      recurrence: getPredictionRecurrenceFromPolymarketEvent(detail) ?? undefined,
                      priceToBeat: detail.eventMetadata?.priceToBeat,
                      finalPrice: detail.eventMetadata?.finalPrice,
                  }
                : undefined,
        series: detail.series
            ?.filter((s) => s.active)
            ?.map((s) => ({
                id: s.id,
                slug: s.slug,
                originalRecurrence: s.recurrence,
                recurrence: fixRecurrence(s.recurrence, detail.startTime, detail.endDate),
            })),
    };
}

function formatOpinionMarket(market: OpinionMarketDetail): BetsMarketDataForUI {
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
}

export function formatOpinionEvent(detail: OpinionMarketDetail): BetsEventDataForUI {
    const markets = (detail.childList || []).map(formatOpinionMarket);

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
        markets: markets.length ? sortMarkets(markets) : [formatOpinionMarket(detail)],
    };
}
