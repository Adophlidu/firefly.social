import type { PredictionPlatform } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useEffect, useRef } from 'react';

import { queryClient } from '@/configs/queryClient.js';

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
            if (!fetchedRef.current && Date.now() > new Date(endDate).getTime()) {
                fetchedRef.current = true;
                queryClient.refetchQueries({
                    queryKey: [Source.Prediction, 'event', platform, slug],
                });
            }
        };

        const timer = setTimeout(checkDate, new Date(endDate).getTime() - Date.now());
        document.addEventListener('visibilitychange', checkDate);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', checkDate);
        };
    }, [platform, endDate, disabled, slug]);
}
