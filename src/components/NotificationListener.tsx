'use client';

import { useEffect } from 'react';

import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useNewestNotification } from '@/hooks/useNewestNotification.js';
import { listenNotifications, stopListenNotifications } from '@/services/listenNotifications.js';

export function NotificationListener() {
    const isSyncing = useAsyncStatusAll();
    const isLoginFirefly = useIsLoginFirefly();
    const recordWithNew = useNewestNotification();
    const pathname = usePathname();

    const isNotificationPage = isRoutePathname(pathname, PageRoute.Notifications);
    const shouldNotListen = !isLoginFirefly || isNotificationPage || !!recordWithNew;

    useEffect(() => {
        if (isSyncing) return;
        if (shouldNotListen) {
            stopListenNotifications();
            return;
        }

        listenNotifications(10000); // delay 10 seconds

        return () => {
            stopListenNotifications();
        };
    }, [isSyncing, shouldNotListen]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                stopListenNotifications();
                return;
            }
            if (document.visibilityState === 'visible' && !shouldNotListen) {
                listenNotifications();
                return;
            }

            return;
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [shouldNotListen]);

    return null;
}
