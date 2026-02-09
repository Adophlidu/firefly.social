'use client';

import { first } from 'lodash-es';
import { useCallback } from 'react';

import { PageRoute } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { logger } from '@/libs/Logger.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function useComeBack(path = PageRoute.Home) {
    const router = useRouter();

    return useCallback(() => {
        const routeChanged = useGlobalState.getState().routeChanged;
        if (!routeChanged) {
            router.push(path);
            return;
        }

        // Check if the page was reloaded or navigated to directly, and if so, navigate to the specified path instead of going back
        try {
            const navigationEntries = performance.getEntriesByType('navigation');
            const firstEntry = first(navigationEntries) as PerformanceNavigationTiming | undefined;
            if (firstEntry?.type === 'reload' || firstEntry?.type === 'navigate') {
                router.push(path);
                return;
            }
        } catch (error) {
            logger.error('Error checking navigation type:', error);
        }

        router.back();
    }, [path, router]);
}
