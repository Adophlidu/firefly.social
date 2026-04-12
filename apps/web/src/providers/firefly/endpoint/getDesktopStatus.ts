import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { DesktopLinkInfoStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getDesktopStatus(session: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/statusV2');
    const response = await fetchJson<DesktopLinkInfoStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ session }),
    });
    return resolveFireflyResponseData(response);
}
