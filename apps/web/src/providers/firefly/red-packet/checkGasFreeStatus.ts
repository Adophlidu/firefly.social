import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function checkGasFreeStatus(chainId: number, wallet: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/checkGasFreeRedPacketClaimStatus', {
        wallet,
        chainId,
    });
    const { data } = await fetchJson<
        FireflyRedPacketAPI.Response<{
            substituteGasStatus: boolean;
        }>
    >(url);
    return data.substituteGasStatus;
}
