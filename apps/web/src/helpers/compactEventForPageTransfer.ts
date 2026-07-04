import { SSR_LIST_LIMIT, SSR_SPORT_GAME_LINE_MARKETS_LIMIT } from '@/constants/ssr.js';
import { isDedicatedSportMarketTab } from '@/helpers/prediction/sportMarketTabs.js';
import { getPrimaryMarket } from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsEventDataForUI, BetsMarketDataForUI } from '@/types/prediction.js';

function compactMarketForPageTransfer(market: BetsMarketDataForUI): BetsMarketDataForUI {
    return {
        ...market,
        question: undefined,
        slug: undefined,
        image: undefined,
        originalMoneylineMarkets: undefined,
    };
}

function limitMarkets(markets: BetsMarketDataForUI[], limit: number, primary?: BetsMarketDataForUI) {
    if (markets.length <= limit) return markets;

    const selected = new Map<string, BetsMarketDataForUI>();
    if (primary) selected.set(primary.id, primary);

    for (const market of markets) {
        if (selected.size >= limit) break;
        selected.set(market.id, market);
    }

    return [...selected.values()];
}

function selectMarketsForPageTransfer(event: BetsEventDataForUI): BetsMarketDataForUI[] {
    const { markets, sportData } = event;
    if (!markets.length) return markets;

    if (sportData) {
        const primary = getPrimaryMarket(markets);
        const gameLineMarkets = markets.filter((market) => !isDedicatedSportMarketTab(market));
        return limitMarkets(gameLineMarkets, SSR_SPORT_GAME_LINE_MARKETS_LIMIT, primary);
    }

    if (markets.length <= SSR_LIST_LIMIT) return markets;
    return markets.slice(0, SSR_LIST_LIMIT);
}

/** Drop heavy nested fields before passing event data through the RSC client boundary. */
export function compactEventForPageTransfer(event: BetsEventDataForUI): BetsEventDataForUI {
    return {
        ...event,
        markets: selectMarketsForPageTransfer(event).map(compactMarketForPageTransfer),
    };
}
