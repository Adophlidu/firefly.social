import { bom } from '@dimensiondev/utils';
import { has, throttle } from 'lodash-es';
import { useCallback, useEffect, useRef } from 'react';

interface UseScrollRestorationOptions {
    key?: string;
    autoRestore?: boolean;
    restoreDelay?: number;
    throttleMs?: number;
}

const routePositionRecords: Record<string, number> = {};

export function useScrollRestoration(options?: UseScrollRestorationOptions) {
    const pathname = options?.key ?? bom.window?.location?.pathname ?? '';
    const hasRestored = useRef(false);

    useEffect(() => {
        const saveScrollPosition = throttle(() => {
            routePositionRecords[pathname] = window.scrollY;
        }, options?.throttleMs ?? 200);

        bom.window?.addEventListener('scroll', saveScrollPosition);

        return () => {
            bom.window?.removeEventListener('scroll', saveScrollPosition);
        };
    }, [pathname, options?.throttleMs]);

    const restore = useCallback(() => {
        if (hasRestored.current) return;
        hasRestored.current = true;

        if (has(routePositionRecords, pathname)) {
            setTimeout(() => {
                bom.window?.scrollTo(0, routePositionRecords[pathname] || 0);
            }, options?.restoreDelay ?? 500);
        }
    }, [pathname, options?.restoreDelay]);

    useEffect(() => {
        if (!options?.autoRestore) return;
        restore();
    }, [options?.autoRestore, restore]);

    return { restore };
}
