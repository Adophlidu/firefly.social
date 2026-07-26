import { DEFAULT_SOCIAL_SOURCE } from '@dimensiondev/constants/computed';
import { useRouterState } from '@dimensiondev/ssr';
import { useEffect } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

/**
 * The home route redirects by login state — client-only by nature
 * (no SSR shell content beyond the pending component).
 */
function HomeRedirect() {
    const { navigate } = useRouterState();
    const isLogin = useIsLoginDiscoverSource();

    useEffect(() => {
        const target = isLogin
            ? resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE)
            : resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE);
        navigate?.(target, { replace: true });
    }, [isLogin, navigate]);

    return null;
}

export default function HomePage() {
    return (
        <NoSSR>
            <HomeRedirect />
        </NoSSR>
    );
}
