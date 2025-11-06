import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function getThemes() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/themeList');
    const { data } = await fetchJson<FireflyRedPacketAPI.ThemeListResponse>(url);
    return data.list;
}
