'use client';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { useMemo } from 'react';

dayjs.extend(utc);
dayjs.extend(timezone);

interface PredictionEventTimeRangeProps {
    startTime: string;
    endDate: string;
}

export function PredictionEventTimeRange({ startTime, endDate }: PredictionEventTimeRangeProps) {
    const timeStr = useMemo(() => {
        const ET_ZONE = 'America/New_York';
        const start = dayjs(startTime).tz(ET_ZONE);
        const end = dayjs(endDate).tz(ET_ZONE);

        if (start.isSame(end, 'year') && start.isSame(end, 'month') && start.isSame(end, 'day')) {
            return `${start.format('MMM D, YYYY, h:mm A')} - ${end.format('h:mm A')} ET`;
        }
        if (start.isSame(end, 'year') && start.isSame(end, 'month')) {
            return `${start.format('MMM D, YYYY, h:mm A')} - ${end.format('D, h:mm A')} ET`;
        }
        if (start.isSame(end, 'year')) {
            return `${start.format('MMM D, YYYY, h:mm A')} - ${end.format('MMM D, h:mm A')} ET`;
        }
        return `${start.format('MMM D, YYYY, h:mm A')} - ${end.format('MMM D, YYYY, h:mm A')} ET`;
    }, [startTime, endDate]);

    return (
        <span className="text-xs" suppressHydrationWarning>
            {timeStr}
        </span>
    );
}
