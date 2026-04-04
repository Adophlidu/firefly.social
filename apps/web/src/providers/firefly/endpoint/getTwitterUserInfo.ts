import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type TwitterUserInfoResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTwitterUserInfo(screenName: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/twitter/userinfo', {
        screenName,
    });
    const response = await fetchJson<TwitterUserInfoResponse>(url);
    return resolveFireflyResponseData(response);
}
