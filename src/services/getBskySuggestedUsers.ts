import type { AppBskyActorDefs } from '@atproto/api';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function getBskySuggestedUsers(
    indicator?: PageIndicator,
    category?: string,
    limit = 20,
): Promise<Pageable<Profile, PageIndicator | undefined>> {
    const bskyProfile = getCurrentProfile(Source.Bsky);
    if (!bskyProfile || !bskySessionHolder.session) {
        return createPageable([], indicator);
    }

    const preferences = await queryClient.fetchQuery({
        queryKey: ['preferences', Source.Bsky, bskyProfile.profileId],
        queryFn: () => bskySessionHolder.agent.getPreferences(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
    const interests = preferences?.interests?.tags?.join(',') || '';

    const response = await bskySessionHolder.agent.sessionManager.fetchHandler(
        urlcat('/xrpc/app.bsky.unspecced.getSuggestedUsers', { limit, category, cursor: indicator?.id }),
        {
            headers: {
                'X-Bsky-Topics': interests,
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

    return createPageable(result.actors.map(formatBskyProfile), indicator);
}
