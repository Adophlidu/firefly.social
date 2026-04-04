import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SyncChannelStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSyncChannelStatus(session: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/sync/channelStatus');
    const response = await fireflySessionHolder.fetchWithSession<SyncChannelStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ session }),
    });
    return resolveFireflyResponseData(response);
}
