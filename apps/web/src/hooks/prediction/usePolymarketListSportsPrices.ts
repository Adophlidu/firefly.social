import { useMemo } from 'react';

import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { useLiveSportsMarketPrices } from '@/hooks/prediction/useLiveSportsMarketPrices.js';
import type { PolymarketEventListData, PolymarketSportsEvent } from '@/providers/types/Firefly.js';

export function usePolymarketListSportsPrices(items: PolymarketEventListData[]) {
    const sportsEvents = useMemo(
        () =>
            items.filter((event) =>
                formatPolymarketSportsEventForUI(event as PolymarketSportsEvent),
            ) as PolymarketSportsEvent[],
        [items],
    );

    return useLiveSportsMarketPrices(sportsEvents);
}
