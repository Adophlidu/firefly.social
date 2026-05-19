import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { pickLatestEndDateEvent } from '@/helpers/prediction/polymarket/eventSeriesPills/filterAndSortSeriesEvents.js';
import { getSeriesSettings } from '@/helpers/prediction/polymarket/eventSeriesPills/getSeriesSettings.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const FORTY_EIGHT_HOURS_MS = 1728e5;

/**
 * Polymarket `ef` — events shown in the More menu.
 */
export function selectMoreEvents(
    openEvents: SeriesEventForPills[] | null | undefined,
    currentSlug: string,
    currentPills: SeriesEventForPills[] | null | undefined,
    serverNow: number,
): SeriesEventForPills[] | null {
    if (!openEvents?.length) return null;

    const { useHourlyFiltering, timezone: tz } = getSeriesSettings(currentSlug);

    if (useHourlyFiltering && currentPills && currentPills.length > 0) {
        const maxEnd = new Date(currentPills.reduce(pickLatestEndDateEvent).endDate ?? '').getTime();
        const nowEt = dayjs(serverNow).tz(tz);
        const horizon = nowEt.clone().add(FORTY_EIGHT_HOURS_MS, 'millisecond');

        return openEvents.filter((event) => {
            const endEt = dayjs(event.endDate ?? event.eventDate).tz(tz);
            return (
                endEt.valueOf() > maxEnd && endEt.valueOf() > nowEt.valueOf() && endEt.valueOf() <= horizon.valueOf()
            );
        });
    }

    let more = openEvents.slice(4);

    if (currentPills?.some((e) => e.slug === currentSlug)) {
        more = more.filter((e) => e.slug !== currentSlug);
    }

    return more;
}
