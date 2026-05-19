'use client';

import { DEFAULT_SOCIAL_SOURCE } from '@dimensiondev/constants/computed';
import type { ReactNode } from 'react';

import { NoSSR } from '@/components/NoSSR.js';
import { redirect, RedirectType } from '@/esm/navigation.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

function Redirect(): ReactNode {
    const isLogin = useIsLoginDiscoverSource();
    if (isLogin) redirect(resolveFollowingUrl(DEFAULT_SOCIAL_SOURCE), RedirectType.replace);
    redirect(resolveDiscoverUrl(DEFAULT_SOCIAL_SOURCE), RedirectType.replace);
}

export default function Page() {
    return (
        <NoSSR>
            <Redirect />
        </NoSSR>
    );
}
