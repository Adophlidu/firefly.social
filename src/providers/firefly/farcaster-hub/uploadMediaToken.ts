import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type UploadMediaTokenResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function uploadMediaToken() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/uploadMediaToken');
    const response = await fetchJson<UploadMediaTokenResponse>(url);
    return resolveFireflyResponseData(response);
}
