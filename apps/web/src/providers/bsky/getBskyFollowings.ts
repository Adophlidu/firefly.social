import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { getBskyProfilesByIds } from '@/providers/bsky/getBskyProfilesByIds.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyFollowings(
    profileId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Profile, PageIndicator>> {
    const response = await bskySessionHolder.agent.getFollows(
        {
            actor: profileId,
            cursor: indicator?.id,
            limit: 20,
        },
        { signal },
    );
    const data = await getBskyProfilesByIds(
        response.data.follows.map((x) => x.did),
        signal,
    );
    return createPageable(
        data,
        createIndicator(indicator),
        response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
