import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type DesktopLinkInfoResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getDesktopLinkInfo() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/linkInfo');
    const response = await fetchJson<DesktopLinkInfoResponse>(url);
    return resolveFireflyResponseData(response);
}
