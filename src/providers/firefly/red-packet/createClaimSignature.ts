import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createClaimSignature(options: FireflyRedPacketAPI.CheckClaimStrategyStatusOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/claim');
    const { data } = await fetchJson<FireflyRedPacketAPI.ClaimResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    return data;
}
