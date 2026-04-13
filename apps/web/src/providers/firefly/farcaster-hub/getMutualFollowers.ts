import { EMPTY_LIST } from '@dimensiondev/constants';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { omitEmptyParams } from '@/helpers/omitEmptyParams.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { ensureFollowersIsNotEmpty } from '@/providers/firefly/farcaster-hub/ensureFollowersIsNotEmpty.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { MutualFollowersResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getMutualFollowers(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        const size = 20;
        const params = omitEmptyParams({
            fid: profileId,
            size,
            cursor: indicator?.id,
            sourceFid: session?.profileId,
        });
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/followersmutual', params);
        const response = await fireflySessionHolder.fetch<MutualFollowersResponse>(url);
        const data = resolveFireflyResponseData(response);

        if (!data) {
            return createPageable(EMPTY_LIST, createIndicator(indicator), undefined, 0);
        }

        const { list, total } = data;
        const currentCursor = Number.parseInt(params.cursor || '0', 10);
        const next_cursor = total > currentCursor + size ? currentCursor + size : undefined;

        return createPageable(
            ensureFollowersIsNotEmpty(list),
            createIndicator(indicator),
            next_cursor ? createNextIndicator(indicator, `${next_cursor}`) : undefined,
            total,
        );
    });
}
