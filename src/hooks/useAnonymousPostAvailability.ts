import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { type SocialSource, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SUPPORTED_ANONYMOUS_POST_SOURCES } from '@/constants/index.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { PostByAnonymousRateLimitsResponse } from '@/providers/types/Firefly.js';

export function useAnonymousPostAvailability(): {
    data: PostByAnonymousRateLimitsResponse['data'];
    loading: boolean;
    canPost: boolean;
    sources: SocialSource[];
} {
    const isLoginFirefly = useIsLoginFirefly();
    const enabled =
        isLoginFirefly &&
        env.external.NEXT_PUBLIC_POST_BY_ANONYMOUS === STATUS.Enabled &&
        SUPPORTED_ANONYMOUS_POST_SOURCES.length > 0;

    const { isLoading, isRefetching, data } = useQuery({
        enabled,
        staleTime: 1000 * 60, // 1 minute
        queryKey: ['rate-limits', 'post-by-anonymous'],
        queryFn: () => FireflyEndpointProvider.getPostByAnonymousRateLimits(),
    });

    if (!enabled) {
        return {
            data: undefined,
            loading: false,
            canPost: false,
            sources: [],
        };
    }

    const sources: SocialSource[] = compact([
        data?.copyToAnoncast ? Source.Farcaster : null,
        data?.copyToTwitter ? Source.Twitter : null,
    ]).filter((x) => SUPPORTED_ANONYMOUS_POST_SOURCES.includes(x));
    const loading = isLoading || isRefetching;

    return {
        data,
        loading,
        canPost: loading ? false : !!data?.can_post && data.daily_remaining > 0 && sources.length > 0,
        sources,
    };
}
