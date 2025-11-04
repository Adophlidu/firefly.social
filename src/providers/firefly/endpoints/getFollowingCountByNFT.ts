import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetFollowingCountByNFTParams, GetFollowingCountByNFTResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFollowingCountByNFT(options: GetFollowingCountByNFTParams) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/asset/ownersInFriends/count', options);
    const response = await fireflySessionHolder.fetch<GetFollowingCountByNFTResponse>(url, { method: 'GET' });
    return resolveFireflyResponseData(response);
}
