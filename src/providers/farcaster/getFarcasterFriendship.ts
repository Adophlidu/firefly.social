import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type FriendshipResponse } from '@/providers/types/Firefly.js';
import { type Friendship } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getFarcasterFriendship(sourceFid: string, destFid: string) {
    const response = await fetchJson<FriendshipResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/friendship', {
            sourceFid,
            destFid,
        }),
        {
            method: 'GET',
        },
    );
    return resolveFireflyResponseData<Friendship>(response);
}
