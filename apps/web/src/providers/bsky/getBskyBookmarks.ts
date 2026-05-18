import { EMPTY_LIST } from '@dimensiondev/constants';
import { BookmarkType, FireflyPlatform } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { PostAtUri } from '@/providers/bsky/AtUri.js';
import { formatBskyPost } from '@/providers/bsky/formatBskyFeedPost.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BookmarkResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getBskyBookmarks(
    indicator?: PageIndicator,
    signal?: AbortSignal,
): Promise<Pageable<Post, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
        post_type: BookmarkType.All,
        platforms: FireflyPlatform.Bsky,
        limit: 25,
        cursor: indicator?.id || undefined,
    });
    const response = await fireflySessionHolder.fetch<BookmarkResponse<{}>>(url);
    const uris = response.data?.list.map((x) => PostAtUri.fromId(x.post_id).toUri()) || EMPTY_LIST;
    const posts = uris.length
        ? resolveBskyResponseData(
              await bskySessionHolder.agent.getPosts(
                  {
                      uris,
                  },
                  { signal },
              ),
          ).posts
        : EMPTY_LIST;

    return createPageable(
        posts.map((x) => ({ ...formatBskyPost(x), hasBookmarked: true })),
        createIndicator(indicator),
        response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
    );
}
