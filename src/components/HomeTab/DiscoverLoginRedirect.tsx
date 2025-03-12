'use client';

import { redirect, RedirectType } from 'next/navigation.js';
import { useEffect, useRef } from 'react';

import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

export function DiscoverLoginRedirect() {
    const isLogin = useIsLoginDiscoverSource();
    const prevLoginRef = useRef(isLogin);

    useEffect(() => {
        if (prevLoginRef.current === isLogin) return;
        prevLoginRef.current = isLogin;
        redirect(
            isLogin ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE) : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE),
            RedirectType.replace,
        );
    }, [isLogin]);

    return null;
}
