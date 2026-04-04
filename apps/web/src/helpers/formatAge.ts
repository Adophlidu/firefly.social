import { plural, t } from '@lingui/core/macro';

const MINUTE_SPAN = 60 * 1000;
const HOUR_SPAN = 60 * MINUTE_SPAN;
const DAY_SPAN = 24 * HOUR_SPAN;
const MONTH_SPAN = 30 * DAY_SPAN;
const YEAR_SPAN = 12 * MONTH_SPAN;

export function formatAge(birthdate: string | Date) {
    const date = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
    const now = new Date();
    const span = now.getTime() - date.getTime();

    if (span < MINUTE_SPAN) return t`Just now`;
    if (span < HOUR_SPAN)
        return plural(Math.floor(span / MINUTE_SPAN), {
            one: '# minute',
            other: '# minutes',
        });

    if (span < DAY_SPAN)
        return plural(Math.floor(span / HOUR_SPAN), {
            one: '# hour',
            other: '# hours',
        });

    if (span < MONTH_SPAN)
        return plural(Math.floor(span / DAY_SPAN), {
            one: '# day',
            other: '# days',
        });

    if (span < YEAR_SPAN)
        return plural(Math.floor(span / MONTH_SPAN), {
            one: '# month',
            other: '# months',
        });

    return plural(Math.floor(span / YEAR_SPAN), {
        one: '# year',
        other: '# years',
    });
}
