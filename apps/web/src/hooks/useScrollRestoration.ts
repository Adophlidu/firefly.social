import { bom } from '@dimensiondev/utils';
import { has, throttle } from 'lodash-es';
import { useCallback, useEffect, useRef } from 'react';

import { usePathname } from '@/esm/navigation.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function useScrollRestoration() {
    const pathname = usePathname();
    const hasRestored = useRef(false);
    const { routePositionRecords, setRoutePositionRecords } = useGlobalState();

    useEffect(() => {
        const saveScrollPosition = throttle(() => {
            setRoutePositionRecords(pathname, window.scrollY);
        }, 200);

        bom.window?.addEventListener('scroll', saveScrollPosition);

        return () => {
            bom.window?.removeEventListener('scroll', saveScrollPosition);
        };
    }, [pathname, setRoutePositionRecords]);

    const restore = useCallback(() => {
        if (hasRestored.current) return;
        hasRestored.current = true;

        if (has(routePositionRecords, pathname)) {
            setTimeout(() => {
                bom.window?.scrollTo(0, routePositionRecords[pathname] || 0);
            }, 500);
        }
    }, [pathname, routePositionRecords]);

    return { restore };
}
