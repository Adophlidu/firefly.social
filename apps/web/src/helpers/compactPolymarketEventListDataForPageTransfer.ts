import { SSR_POLYMARKET_LIST_MARKETS_LIMIT } from '@/constants/ssr.js';
import { formatPolymarketMarketToBetsMarket } from '@/helpers/formatPolymarketEventListData.js';
import { selectPolymarketListMarketsForDisplay } from '@/helpers/prediction/selectPolymarketListMarketsForDisplay.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

function compactMarketForListTransfer(market: PolymarketEventListData['markets'][number]) {
    return {
        ...market,
        description: '',
        resolutionSource: '',
        clobRewards: [],
        events: undefined,
    };
}

function selectMarketsForPageTransfer(event: PolymarketEventListData) {
    const uiMarkets = event.markets.map(formatPolymarketMarketToBetsMarket);
    const selected = selectPolymarketListMarketsForDisplay(uiMarkets, event.sortBy, SSR_POLYMARKET_LIST_MARKETS_LIMIT);
    const marketById = new Map(event.markets.map((market) => [market.id, market]));
    return selected.map((market) => compactMarketForListTransfer(marketById.get(market.id)!));
}

/** Drop heavy nested fields before passing list items through the RSC client boundary. */
export function compactPolymarketEventListDataForPageTransfer(event: PolymarketEventListData): PolymarketEventListData {
    return {
        ...event,
        description: '',
        resolutionSource: '',
        series: null,
        markets: selectMarketsForPageTransfer(event),
    };
}

export function compactPolymarketEventListForPageTransfer(
    events: PolymarketEventListData[],
): PolymarketEventListData[] {
    return events.map(compactPolymarketEventListDataForPageTransfer);
}
