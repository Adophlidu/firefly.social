'use client';

import { bom } from '@dimensiondev/utils';
import { useEffect, useRef } from 'react';

import { PageRoute } from '@/constants/enum.js';
import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLoginDiscoverSource, useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export function DiscoverLoginRedirect() {
    const router = useRouter();
    const isLogin = useIsLoginDiscoverSource();
    const isLoginFirefly = useIsLoginFirefly();
    const prevLoginRef = useRef<boolean>(null);
    const isSyncing = useAsyncStatusAll();

    useEffect(() => {
        if (prevLoginRef.current === isLogin || isSyncing || !isLoginFirefly) return;
        prevLoginRef.current = isLogin;

        const pathname = bom.location?.pathname;
        if (isLogin && pathname && isRoutePathname(pathname, '/following/:source', true)) return;

        if (pathname && pathname === PageRoute.DiscoverActivities) return;

        router.replace(
            isLogin ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE) : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE),
            {
                showProgress: false,
                disableSameURL: true,
            },
        );
    }, [isLogin, router, isSyncing, isLoginFirefly]);

    return null;
}
