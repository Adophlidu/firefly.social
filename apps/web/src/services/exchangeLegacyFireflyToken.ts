import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

type ExchangeLegacyTokenResponse = Response<{
    /** Legacy JWT access token when `legacy_jwt` is enabled; empty string otherwise. */
    accessToken: string;
    access_token_v3: string;
    refresh_token_v3: string;
    session_id: string;
}>;

/**
 * Exchanges a legacy Firefly JWT (v1) bearer token for a v3 token pair so legacy
 * users are upgraded to the new JWT auth seamlessly.
 *
 * The legacy token is passed via the Authorization header; the backend reads it
 * from the authenticated request rather than the body.
 */
export async function exchangeLegacyFireflyToken(legacyToken: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/exchangeLegacyJWT');
    const response = await fetchJson<ExchangeLegacyTokenResponse>(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${legacyToken}` },
    });
    return resolveFireflyResponseData(response);
}
