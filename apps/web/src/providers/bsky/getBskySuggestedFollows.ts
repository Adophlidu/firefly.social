import { createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { getBskySuggestedUsers } from '@/providers/bsky/getBskySuggestedUsers.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskySuggestedFollows(
    includeFollowingStatus?: boolean,
    _locale?: unknown,
    indicator?: PageIndicator,
): Promise<Pageable<Profile>> {
    if (!bskySessionHolder.session) return createPageable([], indicator);
    return getBskySuggestedUsers(indicator, { limit: 20, queryStats: includeFollowingStatus });
}
