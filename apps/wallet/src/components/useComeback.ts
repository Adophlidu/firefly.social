import { useNavigate } from '@dimensiondev/ssr';
import { useCallback } from 'react';

import { popNavigation } from '@/helpers/navigationHistory.js';
import { store } from '@/store/index.js';
import { routeChangedAtom } from '@/store/routeChanged.js';

export function useComeback(path = '/') {
    const navigate = useNavigate();
    return useCallback(() => {
        const routeChanged = store.get(routeChangedAtom);

        if (!routeChanged) {
            navigate(path);
            return;
        }

        // @dimensiondev/ssr's memory history has no back(); pop the in-app
        // history stack (fed by RouteChangedHandler) instead.
        const previous = popNavigation();
        navigate(previous ?? path, { replace: true });
    }, [path, navigate]);
}
