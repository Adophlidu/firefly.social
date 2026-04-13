import type { PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function getClaimHistory(
    redpacket_id: string,
    indicator?: PageIndicator,
): Promise<FireflyRedPacketAPI.RedPacketClaimListInfo> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/claimHistory', {
        redpacketId: redpacket_id,
        cursor: indicator?.id,
        size: 20,
    });
    const { data } = await fetchJson<FireflyRedPacketAPI.ClaimHistoryResponse>(url);
    return { ...data, chain_id: Number(data.chain_id) };
}
