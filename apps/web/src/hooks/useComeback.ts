'use client';

import { PageRoute } from '@dimensiondev/enums';
import { useCallback } from 'react';

import { useRouter } from '@/esm/navigation.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export function useComeBack(path?: PageRoute) {
    const router = useRouter();
    const isLogin = useIsLogin();

    const defaultPath = path || (isLogin ? PageRoute.FollowingPosts : PageRoute.DiscoverPosts);

    return useCallback(() => {
        const routeChanged = useGlobalState.getState().routeChanged;
        if (!routeChanged) {
            router.push(defaultPath);
            return;
        }

        router.back();
    }, [defaultPath, router]);
}
