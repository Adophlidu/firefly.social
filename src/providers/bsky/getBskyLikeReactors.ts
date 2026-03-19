import { EMPTY_LIST } from '@/constants/static.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { getBskyProfilesByIds } from '@/providers/bsky/getBskyProfilesByIds.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyLikeReactors(
    postId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Profile, PageIndicator>> {
    const atUri = PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.getLikes(
        {
            uri: atUri,
            cursor: indicator?.id,
            limit: 20,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to get like reactors postId = ${postId}.`);
    const likes = data.likes || EMPTY_LIST;
    const profiles = likes.length
        ? await runInSafeAsync(() => getBskyProfilesByIds(likes.map((x) => x.actor.did)), { signal })
        : EMPTY_LIST;

    return createPageable(
        profiles?.length ? profiles : likes.map((x) => formatBskyProfile(x.actor)),
        createIndicator(indicator),
        response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
