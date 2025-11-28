import type { AppBskyActorDefs } from '@atproto/api';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { type Profile, SessionType } from '@/providers/types/SocialMedia.js';

interface Options {
    category?: string;
    limit?: number;
    queryStats?: boolean;
}

export async function getBskySuggestedUsers(
    indicator?: PageIndicator,
    { category, queryStats, limit = 20 }: Options = {},
): Promise<Pageable<Profile, PageIndicator | undefined>> {
    const session = getSessionFromStorage(SessionType.Bsky);
    if (!session || !bskySessionHolder.session) return createPageable([], indicator);

    const preferences = await queryClient.fetchQuery({
        queryKey: ['preferences', Source.Bsky, session.profileId],
        queryFn: () => bskySessionHolder.agent.getPreferences(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const response = await bskySessionHolder.agent.sessionManager.fetchHandler(
        urlcat('/xrpc/app.bsky.unspecced.getSuggestedUsers', { limit, category, cursor: indicator?.id }),
        {
            headers: {
                'X-Bsky-Topics': preferences?.interests?.tags?.join(',') || '',
                'Content-Type': 'application/json',
            },
        },
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch suggested users: ${response.statusText}`);
    }

    const result: { actors?: AppBskyActorDefs.ProfileViewDetailed[] } = await response.json();
    if (!result?.actors?.length) {
        return createPageable([], indicator);
    }

    const profiles = result.actors.map(formatBskyProfile);
    const profilesWithStats = queryStats
        ? await runInSafeAsync(() =>
              bskySocialMediaProvider.getProfilesByIds(profiles.map((profile) => profile.profileId)),
          )
        : undefined;
    if (!profilesWithStats?.length) {
        return createPageable(profiles, indicator);
    }

    return createPageable(
        profiles.map((profile) => {
            const profileWithStats = profilesWithStats.find((p) => p.profileId === profile.profileId);

            return {
                ...profile,
                followerCount: profileWithStats?.followerCount ?? profile.followerCount,
                followingCount: profileWithStats?.followingCount ?? profile.followingCount,
            };
        }),
        indicator,
    );
}
