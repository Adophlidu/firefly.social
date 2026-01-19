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

export async function getBskyRepostReactors(
    postId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    const atUri = PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.getRepostedBy({
        uri: atUri,
        cursor: indicator?.id,
        limit: 25,
    });
    const data = resolveBskyResponseData(response, `Failed to get repost reactors postId = ${postId}.`);
    const repostedBy = data.repostedBy || EMPTY_LIST;
    const profiles = repostedBy.length
        ? await runInSafeAsync(() => getBskyProfilesByIds(repostedBy.map((x) => x.did)))
        : EMPTY_LIST;

    return createPageable(
        profiles?.length ? profiles : repostedBy.map((x) => formatBskyProfile(x)),
        createIndicator(indicator),
        response.data.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
