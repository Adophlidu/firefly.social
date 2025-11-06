import urlcat from 'urlcat';

import { FIREFLY_DEV_ROOT_URL } from '@/constants/index.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
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
        ? `${settings.FIREFLY_ROOT_URL === FIREFLY_DEV_ROOT_URL ? 'dev' : 'prod'}:${session.profileId}`
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
