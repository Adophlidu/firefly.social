'use client';

import { useEffect, useRef } from 'react';

import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

export function DiscoverLoginRedirect() {
    const router = useRouter();
    const isLogin = useIsLoginDiscoverSource();
    const prevLoginRef = useRef(isLogin);

    useEffect(() => {
        if (prevLoginRef.current === isLogin) return;
        prevLoginRef.current = isLogin;
        router.replace(
            isLogin ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE) : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE),
            {
                showProgress: false,
                disableSameURL: true,
            },
        );
    }, [isLogin, router]);

    return null;
}
