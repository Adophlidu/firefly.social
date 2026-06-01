import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { ClaimPlatform, PostOn, PostReaction } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function updateClaimStrategy(
    rpid: string,
    reactions: PostReaction[],
    claimPlatform: ClaimPlatform[],
    postOn: PostOn[],
    publicKey?: string,
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
