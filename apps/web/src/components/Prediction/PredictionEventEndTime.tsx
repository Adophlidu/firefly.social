'use client';

import { appLocaleToBrowserLocale } from '@/helpers/appLocaleToBrowserLocale.js';
import { useLocale } from '@/hooks/useLocale.js';

interface PredictionEventEndTimeProps {
    endTime: number | string;
}

export function PredictionEventEndTime({ endTime }: PredictionEventEndTimeProps) {
    const locale = useLocale();

    return (
        <span className="text-xs" suppressHydrationWarning>
            {new Date(endTime).toLocaleString(appLocaleToBrowserLocale(locale), {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })}
        </span>
    );
}
