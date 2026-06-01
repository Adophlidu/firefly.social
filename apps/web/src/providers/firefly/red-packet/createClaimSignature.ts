import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { CheckClaimStrategyStatusOptions, ClaimResponse } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createClaimSignature(options: CheckClaimStrategyStatusOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/claim');
    const { data } = await fetchJson<ClaimResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    return data;
}
