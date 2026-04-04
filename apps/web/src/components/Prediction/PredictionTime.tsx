'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import { memo } from 'react';

import { useMounted } from '@/hooks/useMounted.js';

dayjs.extend(relativeTime);

interface PredictionTimeProps {
    timestamp: number;
}

export const PredictionTime = memo<PredictionTimeProps>(function PredictionTime({ timestamp }) {
    const isMounted = useMounted();

    if (!isMounted) return null;

    return <>{dayjs(timestamp).fromNow()}</>;
});
