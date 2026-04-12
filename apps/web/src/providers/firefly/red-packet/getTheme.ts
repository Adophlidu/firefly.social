import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function getTheme(options: FireflyRedPacketAPI.ThemeByIdOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/redpacket/themeById', options);
    const { data } = await fetchJson<FireflyRedPacketAPI.ThemeByIdResponse>(url);
    return data;
}
