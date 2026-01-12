import { queryOptions } from '@tanstack/react-query';

import type { SocialSource } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export const pinnedPostQueryKey = (source: SocialSource, profileId: string) =>
    ['pinned-post', source, profileId] as const;

export function pinnedPostQueryOptions(source: SocialSource, profileId: string) {
    return queryOptions({
        queryKey: pinnedPostQueryKey(source, profileId),
        async queryFn() {
            const provider = resolveSocialMediaProvider(source);
            return provider.getPinnedPost(profileId);
        },
    });
}
