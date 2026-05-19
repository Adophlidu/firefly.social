import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { getSeriesSettings } from '@/helpers/prediction/polymarket/eventSeriesPills/getSeriesSettings.js';
import { getServerNow } from '@/helpers/prediction/polymarket/eventSeriesPills/serverNow.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const ET_ZONE = 'America/New_York';

export interface SeriesPillTimeLabels {
    timeText: string;
    dateText: string | null;
}

export interface FormatSeriesEventTimeOptions {
    shouldShowYear?: boolean;
    shouldShowTime?: boolean;
    isHourlyMarket?: boolean;
    checkTodayTomorrow?: boolean;
    todayLabel?: string;
    tomorrowLabel?: string;
    locale?: string;
}

function isValidDate(date: Date): boolean {
    return Number.isFinite(date.getTime());
}

/**
 * Polymarket `eV` — format event end date for pills / ended label.
 */
export function formatSeriesEventTime(
    event: SeriesEventForPills,
    options: FormatSeriesEventTimeOptions = {},
): string | null {
    const {
        shouldShowYear,
        shouldShowTime = true,
        isHourlyMarket = false,
        checkTodayTomorrow = false,
        todayLabel = 'Today',
        tomorrowLabel = 'Tomorrow',
    } = options;

    const raw = event.eventDate ?? event.endDate;
    if (!raw) return null;

    const parsed = new Date(raw);
    if (!isValidDate(parsed)) return null;

    const { shouldShowDetailedTime, timezone: tz } = getSeriesSettings(event.slug);
    const zone = shouldShowDetailedTime ? tz : 'UTC';
    const end = dayjs(parsed).tz(zone);
    const now = dayjs(getServerNow()).tz(zone);

    if (checkTodayTomorrow) {
        const endKey = end.format('YYYY-MM-DD');
        const todayKey = now.format('YYYY-MM-DD');
        const tomorrowKey = now.add(1, 'day').format('YYYY-MM-DD');
        if (endKey === todayKey) return todayLabel;
        if (endKey === tomorrowKey) return tomorrowLabel;
    }

    const showYear = (shouldShowYear ?? end.year() !== now.year()) && !isHourlyMarket;
    let pattern = showYear ? 'MMM D, YYYY' : 'MMM D';
    if (shouldShowTime) pattern = `h:mm A ${pattern}`;

    return end.format(pattern);
}

/**
 * Polymarket `eU` — past dropdown row labels (hourly vs non-hourly).
 */
export function formatPastDropdownTime(
    event: SeriesEventForPills,
    todayLabel: string,
    tomorrowLabel: string,
): SeriesPillTimeLabels {
    const { useHourlyFiltering, timezone: tz } = getSeriesSettings(event.slug);

    if (!useHourlyFiltering) {
        return {
            timeText:
                formatSeriesEventTime(event, {
                    shouldShowYear: true,
                    shouldShowTime: false,
                    isHourlyMarket: false,
                    checkTodayTomorrow: false,
                }) ?? '',
            dateText: null,
        };
    }

    const raw = event.endDate ?? event.eventDate;
    if (!raw) {
        return {
            timeText:
                formatSeriesEventTime(event, {
                    shouldShowYear: true,
                    shouldShowTime: false,
                    checkTodayTomorrow: false,
                }) ?? '',
            dateText: null,
        };
    }

    const end = dayjs(raw).tz(tz);
    const now = dayjs(getServerNow()).tz(tz);
    const tomorrow = now.add(1, 'day');

    const endKey = end.format('YYYY-MM-DD');
    const todayKey = now.format('YYYY-MM-DD');
    const tomorrowKey = tomorrow.format('YYYY-MM-DD');

    let tzLabel = end.format('z');
    if (tz === ET_ZONE) tzLabel = 'ET';

    const timeText = `${end.format('h:mmA')} ${tzLabel}`;

    let dateText: string;
    if (endKey === todayKey) {
        dateText = todayLabel;
    } else if (endKey === tomorrowKey) {
        dateText = tomorrowLabel;
    } else {
        const currentYear = new Date().getFullYear();
        dateText = end.format(end.year() !== currentYear ? 'MMM D, YYYY' : 'MMM D');
    }

    return { timeText, dateText };
}

/**
 * Polymarket current-pill label when `useHourlyFiltering` (time only, compact AM/PM).
 */
export function formatCurrentPillTime(event: SeriesEventForPills): string | null {
    const { useHourlyFiltering, timezone: tz } = getSeriesSettings(event.slug);

    if (!useHourlyFiltering) {
        return formatSeriesEventTime(event, { shouldShowTime: false });
    }

    const raw = event.endDate ?? event.eventDate;
    if (!raw) return formatSeriesEventTime(event, { shouldShowTime: false });

    const end = dayjs(raw).tz(tz);
    return end.format('h:mmA');
}

/** Split AM/PM for smaller styling in UI (Polymarket `eH`). */
export function splitAmPmTime(text: string): { main: string; period: string | null; suffix: string } {
    const match = text.match(/(.*?)(\s?)(AM|PM)(.*)$/i);
    if (!match) return { main: text, period: null, suffix: '' };

    const [, main, , period, suffix] = match;
    return { main: main ?? text, period: period?.toUpperCase() ?? null, suffix: suffix ?? '' };
}
