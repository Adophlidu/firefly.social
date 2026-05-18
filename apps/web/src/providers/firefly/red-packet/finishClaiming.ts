import { SessionType } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { FIREFLY_ROOT_URL_DEV } from '@/constants/static.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function finishClaiming(
    rpid: string,
    platform: FireflyRedPacketAPI.PlatformType,
    profileId: string,
    handle: string,
    txHash: string,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/finishClaiming');
    const session = getSessionFromStorage(SessionType.Firefly);
    const accountId = session?.profileId
        ? `${settings.FIREFLY_ROOT_URL === FIREFLY_ROOT_URL_DEV ? 'dev' : 'prod'}:${session.profileId}`
        : undefined;
    return fireflySessionHolder.fetch<FireflyRedPacketAPI.Response<string>>(url, {
        method: 'POST',
        body: JSON.stringify({
            rpid,
            claimPlatform: platform,
            claimProfileId: profileId,
            claimHandle: handle,
            txHash,
            accountId,
        }),
    });
}
