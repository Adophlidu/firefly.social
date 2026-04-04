import urlcat from 'urlcat';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { ensureFollowersIsNotEmpty } from '@/providers/firefly/farcaster-hub/ensureFollowersIsNotEmpty.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type ReactorsResponse } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getRepostReactors(
    postId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/recasters', {
            castHash: postId,
            size: 15,
            sourceFid: session?.profileId,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<ReactorsResponse>(url);
        const { items, nextCursor } = resolveFireflyResponseData(response);

        return createPageable(
            ensureFollowersIsNotEmpty(items),
            createIndicator(indicator),
            nextCursor ? createNextIndicator(indicator, nextCursor) : undefined,
        );
    });
}
