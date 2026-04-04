import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function searchBskyProfiles(
    q: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Profile, PageIndicator>> {
    const limit = indicator?.size ?? 20;
    const response = await bskySessionHolder.agent.searchActors(
        {
            q,
            limit,
            cursor: indicator?.id,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to search profiles by query = ${q}.`);

    return createPageable(
        data.actors.map((x) => formatBskyProfile(x)),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
