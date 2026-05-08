import { useEffect, useRef } from 'react';

import { queryClient } from '@/configs/queryClient.js';
import { type PredictionPlatform, Source } from '@/constants/enum.js';

interface Options {
    platform: PredictionPlatform;
    disabled: boolean;
    slug?: string;
    endDate?: string;
}

export function useListenPredictionDeadline({ platform, endDate, disabled, slug }: Options) {
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (disabled || !endDate || Date.now() > new Date(endDate).getTime() || !slug) return;

        const checkDate = () => {
            const now = new Date();
            const end = new Date(endDate);
            if (now > end && !fetchedRef.current) {
                fetchedRef.current = true;
                queryClient.refetchQueries({
                    queryKey: [Source.Prediction, 'event', platform, slug],
                });
            }
        };
        const schedule = () => {
            checkDate();
            if (Date.now() > new Date(endDate).getTime()) return;

            requestIdleCallback(() => schedule());
        };

        requestIdleCallback(() => schedule());
        document.addEventListener('visibilitychange', checkDate);

        return () => {
            document.removeEventListener('visibilitychange', checkDate);
        };
    }, [platform, endDate, disabled, slug]);
}
