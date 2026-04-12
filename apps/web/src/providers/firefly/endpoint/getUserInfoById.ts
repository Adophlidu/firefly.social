import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { TwitterUserV2Response } from '@/providers/types/Firefly.js';

export async function getUserInfoById(userId: string) {
    if (!userId) return null;
    const url = urlcat('/api/twitter/user/:userId', {
        userId,
    });
    const response = await fetchJson<TwitterUserV2Response>(url);
    return resolveFireflyResponseData(response);
}
