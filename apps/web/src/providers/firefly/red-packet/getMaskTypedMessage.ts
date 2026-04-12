import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function getMaskTypedMessage(rpid: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/misc/maskTypedMessage', { rpid });
    const { data } = await fireflySessionHolder.fetchWithoutSession<FireflyRedPacketAPI.GetMaskTypedMessageResponse>(
        url,
        {
            method: 'GET',
        },
    );
    return data;
}
