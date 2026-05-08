'use client';

import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { ReactNode } from 'react';

import type { BetsEventDataForUI } from '@/types/prediction.js';

dayjs.extend(utc);
dayjs.extend(timezone);

interface EventTimeProps {
    event: BetsEventDataForUI;
    onlyShowTime?: boolean;
    onlyShowDate?: boolean;
}

export function EventTime({ event, onlyShowTime, onlyShowDate }: EventTimeProps) {
    const { endDate, slug, id } = event;

    if (!endDate) return <span>{slug || id}</span>;

    const ET_ZONE = 'America/New_York';
    const d = dayjs(endDate).tz(ET_ZONE);
    const now = dayjs().tz(ET_ZONE);

    const timeStr = d.format('h:mm A');
    const yearStr = d.format(', YYYY');
    const isToday = d.isSame(now, 'day');
    const isCurrentYear = d.isSame(now, 'year');
    const dateStr = d.format('MMM D'); // e.g. "May 6"
    if (onlyShowDate)
        return (
            <span>
                {dateStr}
                {isCurrentYear ? '' : ` ${yearStr}`}
            </span>
        );
    if (onlyShowTime)
        return <span>{`${timeStr}${isToday ? '' : ` ${dateStr}`}${isCurrentYear ? '' : ` ${yearStr}`}`}</span>;

    let dayLabel: ReactNode;
    if (isToday) {
        dayLabel = <Trans>Today</Trans>;
    } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
        dayLabel = <Trans>Yesterday</Trans>;
    } else if (d.isSame(now.add(1, 'day'), 'day')) {
        dayLabel = <Trans>Tomorrow</Trans>;
    } else {
        dayLabel = dateStr;
    }

    return (
        <>
            <span className="text-main">{timeStr} ET</span>
            <span className="text-second">
                · {dayLabel}
                {isCurrentYear ? '' : ` ${yearStr}`}
            </span>
        </>
    );
}
