import { Locale } from '@dimensiondev/enums';
import { i18n } from '@lingui/core';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc from 'dayjs/plugin/utc.js';
import dayjsTwitter from '@/shims/dayjs-twitter.js';

import { getDayjsLocaleName } from '@/helpers/dayjsLocale.js';
import { getLocalFromClientCookies } from '@/helpers/getCookies.js';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(dayjsTwitter);
dayjs.extend(duration);

/**
 * Formats a date as a string in the format used by the application.
 * @param date The date to format.
 * @returns A string in the application date format.
 */
export function formatDate(date?: Date, _format = 'MMMM D, YYYY') {
    return date ? i18n.date(date, { dateStyle: 'medium', timeStyle: 'medium' }) : '';
}

export function getTimeLeft(endDatetime: string | number, startDatetime: string | number = new Date().toISOString()) {
    const timeLeft = dayjs(endDatetime).diff(dayjs(startDatetime));
    if (timeLeft < 0) return;

    const duration = dayjs.duration(timeLeft);

    return {
        days: duration.days(),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds(),
    };
}

export function formatEventTimestamp(date: Date | string | number, format = 'MMM DD, HH:mm') {
    return dayjs(date).utc().format(format);
}

function getLocalizedDayjs(date: Date | string | number, locale: Locale = getLocalFromClientCookies()) {
    return dayjs(date).locale(getDayjsLocaleName(locale));
}

export function getTwitterFormat(date: Date | string | number, locale: Locale = getLocalFromClientCookies()) {
    return getLocalizedDayjs(date, locale).twitter();
}

export function formatLocalizedDate(
    date: Date | string | number,
    locale: Locale = getLocalFromClientCookies(),
): string {
    const localizedDate = getLocalizedDayjs(date, locale);
    return locale === Locale.en ? localizedDate.format('MMM DD, YYYY') : localizedDate.format('LL');
}

export function formatLocalizedTime(
    date: Date | string | number,
    locale: Locale = getLocalFromClientCookies(),
): string {
    const localizedDate = getLocalizedDayjs(date, locale);
    return locale === Locale.en ? localizedDate.format('hh:mm A') : localizedDate.format('HH:mm');
}
