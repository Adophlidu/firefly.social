import { PredictionPlatform } from '@dimensiondev/enums';
import { getEventDetail } from '@dimensiondev/workers-metadata/prediction/getEventDetail.js';
import { getPredictionProfile } from '@dimensiondev/workers-metadata/prediction/getPredictionProfile.js';
import type {
    BetPortfolioItem,
    BetsEventDataForUI,
    OpinionMarketDetail,
    PolymarketEvent,
} from '@dimensiondev/workers-metadata/prediction/types.js';
import { parseJson } from '@dimensiondev/workers-shared/helpers/parseJson.js';
import type { Context } from 'hono';

import {
    OPINION_EVENT_REGEX,
    OPINION_PROFILE_REGEX,
    POLYMARKET_EVENT_REGEX,
    POLYMARKET_PROFILE_USERNAME_REGEX,
    POLYMARKET_PROFILE_WALLET_REGEX,
} from '@/og/src/regexp.js';
import { searchPolymarketProfile } from '@/og/src/searchPolymarketProfile.js';

interface PredictionResult {
    prediction_profile?: BetPortfolioItem;
    prediction_event?: BetsEventDataForUI;
}

function sortMarkets(markets: BetsEventDataForUI['markets']) {
    return [
        ...markets.filter((market) => !market.isResolved && !market.isClosed),
        ...markets.filter((market) => market.isResolved || market.isClosed),
    ];
}

function formatPolymarketEvent(event: PolymarketEvent): BetsEventDataForUI {
    return {
        id: event.id,
        title: event.title,
        image: event.image,
        icon: event.icon,
        endTime: new Date(event.endDate).getTime(),
        isSingleEvent: event.markets.length === 1,
        platform: PredictionPlatform.Polymarket,
        status: event.closed ? 'ended' : 'active',
        markets: event.markets.map((market) => {
            const outcomeLabels = parseJson<string[]>(market.outcomes) ?? [];
            const outcomePrices = parseJson<string[]>(market.outcomePrices) ?? [];

            const outcomes = outcomeLabels.map((label, index) => ({
                id: `${market.id}-${index}`,
                label,
                price: outcomePrices[index] ?? '0',
            }));

            return {
                id: market.id,
                conditionId: market.conditionId,
                questionId: market.id,
                title: market.question,
                volume: market.volume,
                isResolved: market.closed && market.umaResolutionStatus === 'resolved',
                isClosed: market.closed,
                createTime: new Date(market.createdAt).getTime(),
                slug: market.slug,
                image: market.image,
                outcomes,
                bestAsk: market.bestAsk,
                bestBid: market.bestBid,
                question: market.question,
                active: market.active,
                groupItemTitle: market.groupItemTitle,
                groupItemThreshold: market.groupItemThreshold,
            };
        }),
        tags: event.tags?.map((tag) => ({
            id: tag.id,
            label: tag.label,
            slug: tag.slug,
        })),
        description: event.description,
        volume: event.volume,
        slug: event.slug,
        closed: event.closed,
        archived: event.archived,
        sortBy: event.sortBy,
        series: event.series?.map((s) => ({ recurrence: s.recurrence })),
        startDate: event.startDate,
    };
}

function formatOpinionEvent(detail: OpinionMarketDetail): BetsEventDataForUI {
    const markets: BetsEventDataForUI['markets'] = (detail.childList || []).map((market) => {
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
        id: `${detail.topicId}`,
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

export async function getPredictionFromUrl(url: string, c: Context): Promise<PredictionResult | null> {
    try {
        // Polymarket profile with username
        const usernameMatch = url.match(POLYMARKET_PROFILE_USERNAME_REGEX);
        if (usernameMatch) {
            const username = usernameMatch[1];
            const proxyAddress = await searchPolymarketProfile(username, c);
            if (!proxyAddress) return null;

            const profile = await getPredictionProfile(PredictionPlatform.Polymarket, proxyAddress, c);
            if (!profile) return null;

            return { prediction_profile: profile };
        }

        // Polymarket profile with wallet
        const walletMatch = url.match(POLYMARKET_PROFILE_WALLET_REGEX);
        if (walletMatch) {
            const proxyAddress = walletMatch[1];
            const profile = await getPredictionProfile(PredictionPlatform.Polymarket, proxyAddress, c);
            if (!profile) return null;

            return { prediction_profile: profile };
        }

        // Polymarket event
        const eventMatch = url.match(POLYMARKET_EVENT_REGEX);
        if (eventMatch) {
            const slug = eventMatch[1];
            const eventData = await getEventDetail(PredictionPlatform.Polymarket, { id: slug }, c);
            if (!eventData) return null;

            const event = formatPolymarketEvent(eventData as PolymarketEvent);
            return { prediction_event: event };
        }

        // Opinion profile
        const opinionProfileMatch = url.match(OPINION_PROFILE_REGEX);
        if (opinionProfileMatch) {
            const address = opinionProfileMatch[1];
            const profile = await getPredictionProfile(PredictionPlatform.Opinion, address, c);
            if (!profile) return null;

            return { prediction_profile: profile };
        }

        // Opinion event
        const opinionEventMatch = url.match(OPINION_EVENT_REGEX);
        if (opinionEventMatch) {
            const topicId = opinionEventMatch[1];
            const isMutil = opinionEventMatch[2] === 'multi';

            const eventData = await getEventDetail(PredictionPlatform.Opinion, { id: topicId, isMutil }, c);
            if (!eventData) return null;

            const event = formatOpinionEvent(eventData as OpinionMarketDetail);
            return { prediction_event: event };
        }

        return null;
    } catch (error) {
        console.error('[getPredictionFromUrl] Error:', error);
        return null;
    }
}
