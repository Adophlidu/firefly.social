import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createPublicKey(
    themeId: string,
    shareFrom: string,
    strategies: FireflyRedPacketAPI.ClaimStrategy[],
): Promise<Hex> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/createPublicKey');
    const { data } = await fetchJson<FireflyRedPacketAPI.PublicKeyResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            themeId,
            shareFrom,
            claimFrom: FireflyRedPacketAPI.SourceType.FireflyPC,
            claimStrategy: JSON.stringify(strategies),
        }),
    });
    return data.publicKey;
}
