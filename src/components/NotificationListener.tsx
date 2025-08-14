'use client';

import { useEffect } from 'react';

import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { listenNotifications, stopListenNotifications } from '@/services/listenNotifications.js';

export function NotificationListener() {
    const isSyncing = useAsyncStatusAll();
    const isLoginFirefly = useIsLoginFirefly();

    useEffect(() => {
        if (isSyncing) return;
        if (!isLoginFirefly) {
            stopListenNotifications();
            return;
        }

        listenNotifications();

        return () => {
            stopListenNotifications();
        };
    }, [isSyncing, isLoginFirefly]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                stopListenNotifications();
                return;
            }
            if (document.visibilityState === 'visible' && isLoginFirefly) {
                listenNotifications();
                return;
            }

            return;
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [isLoginFirefly]);

    return null;
}
