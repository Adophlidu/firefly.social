import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type {
    CheckClaimStrategyStatusOptions,
    CheckClaimStrategyStatusResponse,
} from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function checkClaimStrategyStatus(options: CheckClaimStrategyStatusOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/checkClaimStrategyStatus');
    return fetchJson<CheckClaimStrategyStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });
}
