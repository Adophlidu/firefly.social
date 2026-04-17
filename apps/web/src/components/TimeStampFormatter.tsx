'use client';

import { getTwitterFormat } from '@/helpers/formatTimestamp.js';
import { useLocale } from '@/helpers/getCookies.js';
import { useMounted } from '@/hooks/useMounted.js';

export function TimestampFormatter({ time }: { time: string | number | Date | undefined }) {
    const isMounted = useMounted();
    const locale = useLocale();

    if (!isMounted || !time) return null;
    return <>{getTwitterFormat(time, locale)}</>;
}
