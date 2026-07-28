import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { sortSeriesEventsByEndDateAsc } from '@/helpers/prediction/polymarket/eventSeriesPills/filterAndSortSeriesEvents.js';
import { getSeriesSettings } from '@/helpers/prediction/polymarket/eventSeriesPills/getSeriesSettings.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const MAX_CURRENT_PILLS = 4;

const FORTY_EIGHT_HOURS_MS = 1728e5;

function formatYmdEt(date: dayjs.Dayjs): string {
    return date.format('YYYY-MM-DD');
}

/**
 * Polymarket `eh` — visible current series pills (max 4).
 */
export function selectCurrentPills(
    openEvents: SeriesEventForPills[] | null | undefined,
    currentSlug: string,
    currentClosed: boolean,
    serverNow: number,
): SeriesEventForPills[] | null {
    if (!openEvents?.length) return null;

    const { useHourlyFiltering, timezone: tz } = getSeriesSettings(currentSlug);

    if (useHourlyFiltering) {
        const nowEt = dayjs(serverNow).tz(tz);
        const hour = nowEt.hour();
        const windowStart = nowEt
            .clone()
            .hour(hour - 2)
            .minute(0)
            .second(0)
            .millisecond(0);
        const windowEndSameDay = nowEt
            .clone()
            .hour(hour + 4)
            .minute(0)
            .second(0)
            .millisecond(0);
        const endOfDay = nowEt.clone().hour(23).minute(59).second(59).millisecond(999);
        const windowEndCrossDay = nowEt.clone().add(FORTY_EIGHT_HOURS_MS, 'millisecond');

        const isAboveBelow = currentSlug.includes('-above') || currentSlug.includes('-below');
        const is4h = currentSlug.includes('-4h');
        const todayKey = formatYmdEt(nowEt);

        let filtered = openEvents.filter((event) => {
            const endEt = dayjs(event.endDate ?? event.eventDate).tz(tz);
            if (formatYmdEt(endEt) === todayKey) {
                if (isAboveBelow || is4h) {
                    return endEt.valueOf() >= windowStart.valueOf() && endEt.valueOf() <= endOfDay.valueOf();
                }
                return endEt.valueOf() >= windowStart.valueOf() && endEt.valueOf() <= windowEndSameDay.valueOf();
            }
            return endEt.valueOf() > nowEt.valueOf() && endEt.valueOf() <= windowEndCrossDay.valueOf();
        });

        filtered = filtered.slice(0, MAX_CURRENT_PILLS);

        if (!filtered.some((e) => e.slug === currentSlug) && !currentClosed) {
            const current = openEvents.find((e) => e.slug === currentSlug);
            if (current) {
                filtered.push(current);
                filtered.sort(sortSeriesEventsByEndDateAsc);
            }
        }

        return filtered;
    }

    return openEvents.slice(0, MAX_CURRENT_PILLS);
}
