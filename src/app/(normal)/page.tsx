'use client';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { DEFAULT_SOCIAL_SOURCE } from '@/constants/index.js';
import { redirect, RedirectType } from '@/esm/navigation.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { useIsLoginDiscoverSource, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useTwitterTimelineWhitelist } from '@/hooks/useTwitterTimelineWhiteList.js';

function Redirect() {
    const { isLoading: isLoadingTimelineWhitelist } = useTwitterTimelineWhitelist();
    const isLogin = useIsLoginDiscoverSource();
    const isLoginFirefly = useIsLoginFirefly();
    if (isLoginFirefly && isLoadingTimelineWhitelist) {
        return <Loading />;
    }
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
