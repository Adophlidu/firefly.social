import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FollowingTraderCountResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFollowingTraderCount(tokens: Array<{ chain_id: number; token_address: string }>) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/swap/following_count');
    return fireflySessionHolder.withSession(async (session) => {
        if (!session) return null;

        const response = await fireflySessionHolder.fetch<FollowingTraderCountResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                list: tokens,
            }),
        });
        const data = resolveFireflyResponseData(response);
        return data;
    });
}
