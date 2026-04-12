import { PageSize } from '@lens-protocol/client';
import { fetchPosts, fetchTimelineHighlights } from '@lens-protocol/client/actions';
import { compact } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { filterFeedsV3, formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function discoverLensPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
    const lensProfile = getCurrentProfileFromStorage(Source.Lens);

    const result = await ensureLensResult(
        lensProfile
            ? fetchTimelineHighlights(getLensClient(), {
                  account: lensProfile.profileId,
                  cursor: ensureCursor(indicator),
                  pageSize: PageSize.Fifty,
              })
            : fetchPosts(getLensClient(), {
                  cursor: ensureCursor(indicator),
                  pageSize: PageSize.Fifty,
              }),
    );

    if (!result) return createPageable([], createIndicator(indicator));

    const posts = filterFeedsV3(compact(result.items)).map(formatLensPostV3);
    return createPageable(
        posts,
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
