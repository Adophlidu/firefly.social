import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { DesktopLinkInfoStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export type ConfirmSyncChannelOperation = 'confirm' | 'cancel';

export async function confirmSyncChannel(session: string, operation: ConfirmSyncChannelOperation) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/sync/confirm');
    const response = await fireflySessionHolder.fetchWithSession<DesktopLinkInfoStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ session, op: operation }),
    });
    return resolveFireflyResponseData(response);
}
