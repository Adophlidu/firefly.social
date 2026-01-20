import { useMemo, useState } from 'react';

import type { BetsMarketDataForUI } from '@/types/prediction.js';

export function useToggleMarkets(markets: BetsMarketDataForUI[]) {
    const [showMore, setShowMore] = useState(false);
    const toggleType = useMemo(() => {
        if (markets.filter((market) => market.isResolved || market.isClosed).length > 0) {
            return 'resolved';
        }

        return 'none';
    }, [markets]);
    const displayedMarkets = useMemo(() => {
        if (showMore) return markets;
        if (toggleType === 'resolved') {
            return markets.filter((market) => !market.isResolved && !market.isClosed);
        }

        return markets;
    }, [markets, showMore, toggleType]);

    return {
        displayedMarkets,
        showMore,
        toggleType,
        setShowMore,
    } as const;
}
