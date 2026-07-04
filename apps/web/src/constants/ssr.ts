/** Items rendered in list feeds during SSR (matches react-virtuoso initialItemCount). */
export const SSR_LIST_LIMIT = 10;

/** Markets embedded per Polymarket list event during SSR (BetItem shows at most 2). */
export const SSR_POLYMARKET_LIST_MARKETS_LIMIT = 2;

/** Game-line markets included in SSR for sport prediction events (default tab only). */
export const SSR_SPORT_GAME_LINE_MARKETS_LIMIT = 30;
