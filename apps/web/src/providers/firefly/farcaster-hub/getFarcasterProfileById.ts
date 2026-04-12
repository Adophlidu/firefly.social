import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterProfileFromFirefly } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { getFarcasterFriendship } from '@/providers/firefly/farcaster-hub/getFarcasterFriendship.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { UserResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFarcasterProfileById(profileId: string, viewerFid?: string) {
    const response = await fireflySessionHolder.fetch<UserResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/profile', {
            fid: profileId,
            sourceFid: viewerFid,
        }),
    );
    const user = resolveFireflyResponseData(response);
    const friendship = viewerFid ? await getFarcasterFriendship(viewerFid, profileId) : null;
    return formatFarcasterProfileFromFirefly({ ...user, ...friendship });
}
