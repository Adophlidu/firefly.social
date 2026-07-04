import type { Pageable, PageIndicator } from '@dimensiondev/utils';

import type { ProfileFeedInitialData } from '@/app/[locale]/(normal)/profile/(profile)/[source]/[id]/getProfilePageData.js';
import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { compactPostsForPageTransfer } from '@/helpers/compactPostForPageTransfer.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function buildProfileFeedInitialData(page: Pageable<Post, PageIndicator>): ProfileFeedInitialData | undefined {
    if (!page.data.length) return undefined;

    return {
        pages: [
            {
                ...page,
                data: compactPostsForPageTransfer(page.data.slice(0, SSR_LIST_LIMIT)),
            },
        ],
        pageParams: [''],
    };
}
