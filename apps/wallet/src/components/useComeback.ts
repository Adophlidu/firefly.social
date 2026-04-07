import { useNavigate, useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';

import { store } from '@/store/index.js';
import { routeChangedAtom } from '@/store/routeChanged.js';

export function useComeback(path = '/') {
    const navigate = useNavigate();
    const router = useRouter();
    return useCallback(() => {
        const routeChanged = store.get(routeChangedAtom);

        if (!routeChanged) {
            navigate({ to: path });
            return;
        }

        router.history.back();
    }, [path, navigate, router]);
}
