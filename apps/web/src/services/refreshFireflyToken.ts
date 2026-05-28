import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

type RefreshTokenResponse = Response<{
    access_token_v3: string;
    refresh_token_v3: string;
    session_id: string;
}>;

export async function refreshFireflyToken(refreshToken: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/refreshJWT');
    const response = await fetchJson<RefreshTokenResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return resolveFireflyResponseData(response);
}
