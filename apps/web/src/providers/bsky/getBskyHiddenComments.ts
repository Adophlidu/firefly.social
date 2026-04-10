import { moderatePost } from '@atproto/api';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { runInSafeAsync } from '@dimensiondev/utils';
import { compact } from 'lodash-es';

import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { AppBskyFeed } from '@/providers/bsky/contentChecker.js';
import { formatBskyFeedPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function getBskyHiddenComments(
    postId: string,
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    const atUri = PostAtUri.fromId(postId).toUri();
    const response = await bskySessionHolder.agent.getPostThread(
        {
            uri: atUri,
            depth: 10,
        },
        { signal },
    );
    const data = resolveBskyResponseData(response, `Failed to getHiddenComments atUri = ${atUri}.`);
    const did = bskySessionHolder.session?.did;
    if (!AppBskyFeed.isThreadViewPost(data.thread) || !did) {
        return createPageable(EMPTY_LIST, createIndicator(indicator));
    }
    const preferences = await runInSafeAsync(() => bskySessionHolder.agent.getPreferences(), { signal });
    if (!preferences) {
        return createPageable(EMPTY_LIST, createIndicator(indicator));
    }
    const replies = compact(
        data.thread.replies?.map((x) => {
            if (!AppBskyFeed.isThreadViewPost(x)) return null;
            const moderationDecision = moderatePost(x.post, {
                userDid: did,
                prefs: preferences.moderationPrefs,
            });
            if (!moderationDecision.causes.length) return null;
            return formatBskyFeedPost(x);
        }),
    );
    return createPageable(replies, createIndicator(indicator));
}
