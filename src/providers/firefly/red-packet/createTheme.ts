import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createTheme(options: FireflyRedPacketAPI.CreateThemeOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/createTheme');
    const res = await fetchJson<FireflyRedPacketAPI.CreateThemeResponse>(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
    });
    return res.data.tid;
}
