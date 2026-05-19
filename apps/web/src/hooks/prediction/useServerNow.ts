'use client';

import { useEffect, useState } from 'react';

import { isFutureOpenEvent } from '@/helpers/prediction/polymarket/eventSeriesPills/filterAndSortSeriesEvents.js';
import { getServerNow } from '@/helpers/prediction/polymarket/eventSeriesPills/serverNow.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

/**
 * Polymarket server clock for series pills — refreshes when the next open event ends.
 */
export function useServerNow(openEvents: SeriesEventForPills[] | null | undefined): number {
    const [serverNow, setServerNow] = useState(getServerNow);

    useEffect(() => {
        if (!openEvents?.length) return;

        const next = openEvents.find((event) => isFutureOpenEvent(event, serverNow));
        if (!next) return;

        const delay = new Date(next.endDate ?? '').getTime() - getServerNow() + 100;
        if (delay <= 0) {
            setServerNow(getServerNow());
            return;
        }

        const timer = setTimeout(() => setServerNow(getServerNow()), delay);
        return () => clearTimeout(timer);
    }, [openEvents, serverNow]);

    return serverNow;
}
