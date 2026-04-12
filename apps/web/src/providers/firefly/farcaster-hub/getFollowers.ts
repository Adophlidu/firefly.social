import { EMPTY_LIST } from '@dimensiondev/constants';
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
import type { UsersResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getFollowers(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/followers', {
            fid: profileId,
            size: 10,
            cursor: indicator?.id,
            sourceFid: session?.profileId,
        });
        const response = await fireflySessionHolder.fetch<UsersResponse>(url);
        const data = resolveFireflyResponseData(response);

        if (!data) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }

        const { list, next_cursor } = data;

        return createPageable(
            ensureFollowersIsNotEmpty(list),
            createIndicator(indicator),
            next_cursor ? createNextIndicator(indicator, next_cursor) : undefined,
        );
    });
}
