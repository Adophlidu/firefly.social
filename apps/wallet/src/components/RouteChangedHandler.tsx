import { useRouterState } from '@dimensiondev/ssr';
import { useEffect, useRef } from 'react';

import { recordNavigation, replaceNavigation } from '@/helpers/navigationHistory.js';
import { store } from '@/store/index.js';
import { routeChangedAtom } from '@/store/routeChanged.js';

export function RouteChangedHandler() {
    const entryPathname = useRef('');
    const { pathname, search, navigationType } = useRouterState();
    useEffect(() => {
        if (navigationType === 'replace') {
            replaceNavigation(pathname, search.toString());
        } else {
            recordNavigation(pathname, search.toString());
        }
        if (!entryPathname.current || pathname === entryPathname.current) {
            entryPathname.current = pathname;
            return;
        }
        store.set(routeChangedAtom, true);
    }, [pathname, search, navigationType]);
    return null;
}
