import { parseJson } from '@dimensiondev/utils';

import { PredictionPlatform } from '@/constants/enum.js';
import type { PolymarketEventListData, PolymarketMarketData } from '@/providers/types/Firefly.js';
import type { BetsEventDataForUI, BetsMarketDataForUI } from '@/types/prediction.js';

export function formatPolymarketMarketToBetsMarket(market: PolymarketMarketData): BetsMarketDataForUI {
    const outcomeLabels = parseJson<string[]>(market.outcomes) ?? [];
    const outcomePrices = parseJson<string[]>(market.outcomePrices) ?? [];

    const outcomes = outcomeLabels.map((label, index) => ({
        id: `${market.id}-${index}`,
        label,
        price: outcomePrices[index] ?? '0',
    }));

    return {
        id: market.id,
        conditionId: market.conditionId || '',
        questionId: market.questionID || '',
        title: market.question,
        volume: market.volume,
        isResolved: market.umaResolutionStatuses === 'Resolved',
        isClosed: market.closed,
        createTime: new Date(market.createdAt).getTime(),
        resolvedOutcomeId: market.resolvedBy,
        slug: market.slug,
        image: market.image,
        outcomes,
        question: market.question,
        active: market.active,
        groupItemTitle: market.groupItemTitle,
        groupItemThreshold: market.groupItemThreshold,
    };
}

export function formatPolymarketEventListData(event: PolymarketEventListData): BetsEventDataForUI {
    return {
        id: event.id,
        title: event.title,
        image: event.image,
        endTime: new Date(event.endDate).getTime(),
        isSingleEvent: event.markets.length === 1,
        platform: PredictionPlatform.Polymarket,
        status: event.closed ? 'ended' : 'active',
        markets: event.markets.map(formatPolymarketMarketToBetsMarket),
        volume: String(event.volume),
        slug: event.slug,
        icon: event.icon,
        closed: event.closed,
        archived: event.archived,
        startDate: event.startDate,
    };
}
