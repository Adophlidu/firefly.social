/* cspell:disable */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import type { PastMarketVariant } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const MONTH_NAMES = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
] as const;

const ET_ZONE = 'America/New_York';

/** Polymarket `constructPastMarketSlug` (module 162923). */
export function constructPastMarketSlug(
    currentSlug: string,
    startTime: string,
    endTime: string,
    variant: PastMarketVariant,
): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startMs = start.getTime();
    const [prefix] = currentSlug.split('-');
    if (!prefix) return '#';

    if (variant === 'fiveminute') {
        return `${prefix}-updown-5m-${Math.floor(startMs / 1000)}`;
    }
    if (variant === 'fifteen') {
        return `${prefix}-updown-15m-${Math.floor(startMs / 1000)}`;
    }
    if (variant === 'fourhour') {
        return `${prefix}-updown-4h-${Math.floor(startMs / 1000)}`;
    }
    if (variant === 'hourly') {
        const et = dayjs(start).tz(ET_ZONE);
        const month = MONTH_NAMES[et.month()] ?? 'january';
        const day = et.date();
        let hour = et.hour();
        const period = hour >= 12 ? 'pm' : 'am';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        return `${prefix}-up-or-down-${month}-${day}-${hour}${period}-et`;
    }
    if (variant === 'daily') {
        const month = MONTH_NAMES[end.getUTCMonth()] ?? 'january';
        const day = end.getUTCDate();
        const year = end.getUTCFullYear();
        return `${prefix}-up-or-down-on-${month}-${day}-${year}`;
    }
    return '#';
}
