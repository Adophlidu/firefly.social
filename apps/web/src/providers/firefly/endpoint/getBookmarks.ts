import { EMPTY_LIST } from '@dimensiondev/constants';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { compact, isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType, FireflyPlatform } from '@/constants/enum.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BookmarkResponse, Cast } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
            post_type: BookmarkType.All,
            platforms: FireflyPlatform.Farcaster,
            limit: 25,
            cursor: indicator?.id || undefined,
            fid: session?.profileId,
        });
        const response = await fireflySessionHolder.fetch<BookmarkResponse<Cast>>(url);

        const posts = compact(
            response.data?.list.map((x) => {
                if (!x.post_content || isEmpty(x.post_content)) return null;
                const formatted = formatFarcasterPostFromFirefly(x.post_content);
                if (!formatted) return null;
                return {
                    ...formatted,
                    hasBookmarked: true,
                };
            }) || EMPTY_LIST,
        );

        return createPageable(
            posts,
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
        );
    });
}
