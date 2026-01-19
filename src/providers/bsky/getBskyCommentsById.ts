import { moderatePost } from '@atproto/api';
import { compact } from 'lodash-es';

import { EMPTY_LIST } from '@/constants/static.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getBskyCommentsById(
    postId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Post, PageIndicator>> {
    const atUri = PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.getPostThread({
        uri: atUri,
        depth: 10,
    });
    const data = resolveBskyResponseData(response, `Failed to getCommentsById atUri = ${atUri}.`);
    const did = bskySessionHolder.session?.did;
    if (!AppBskyFeed.isThreadViewPost(data.thread)) {
        return createPageable(EMPTY_LIST, createIndicator(indicator));
    }
    const preferences = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences());
    const replies = compact(
        data.thread.replies?.map((x) => {
            if (!AppBskyFeed.isThreadViewPost(x)) return null;
            if (preferences) {
                const moderationDecision = moderatePost(x.post, {
                    userDid: did,
                    prefs: preferences.moderationPrefs,
                });
                if (moderationDecision.causes.length) return null;
            }
            return formatBskyFeedPost(x);
        }),
    );
    return createPageable(replies, createIndicator(indicator));
}
