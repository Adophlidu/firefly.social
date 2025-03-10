'use client';

import { redirect, RedirectType } from 'next/navigation.js';

import { NoSSR } from '@/components/NoSSR.js';
import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource } from '@/hooks/useIsLogin.js';

function Redirect(): never {
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
