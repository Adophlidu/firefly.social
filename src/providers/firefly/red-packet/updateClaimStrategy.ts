import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { type FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function updateClaimStrategy(
    rpid: string,
    reactions: FireflyRedPacketAPI.PostReaction[],
    claimPlatform: FireflyRedPacketAPI.ClaimPlatform[],
    postOn: FireflyRedPacketAPI.PostOn[],
    publicKey: string,
): Promise<void> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/updateClaimStrategy');
    await fetchJson(url, {
        method: 'POST',
        body: JSON.stringify({
            publicKey,
            rpid,
            postReaction: reactions,
            postOn,
            claimPlatform,
        }),
    });
}
