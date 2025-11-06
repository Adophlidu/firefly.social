import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function checkClaimStrategyStatus(options: FireflyRedPacketAPI.CheckClaimStrategyStatusOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/checkClaimStrategyStatus');
    return fetchJson<FireflyRedPacketAPI.CheckClaimStrategyStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
}
