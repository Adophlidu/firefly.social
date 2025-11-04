import urlcat from 'urlcat';

import { ConnectionPlatform } from '@/constants/enum.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type EmptyResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function disconnectAccount(connectionId: string, connectionPlatform: ConnectionPlatform) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/accountConnection');
    await fireflySessionHolder.fetch<EmptyResponse>(url, {
        method: 'DELETE',
        body: JSON.stringify({
            connectionPlatform,
            connectionId,
        }),
    });
}
