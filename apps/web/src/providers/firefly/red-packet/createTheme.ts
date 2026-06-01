import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { CreateThemeOptions, CreateThemeResponse } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createTheme(options: CreateThemeOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/createTheme');
    const res = await fetchJson<CreateThemeResponse>(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
    });
    return res.data.tid;
}
