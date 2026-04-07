import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { store } from '@/store/index.js';
import { routeChangedAtom } from '@/store/routeChanged.js';

export function RouteChangedHandler() {
    const entryPathname = useRef('');
    const location = useLocation();
    const pathname = location.pathname;
    useEffect(() => {
        if (!entryPathname.current || pathname === entryPathname.current) {
            entryPathname.current = pathname;
            return;
        }
        store.set(routeChangedAtom, true);
    }, [pathname]);
    return null;
}
