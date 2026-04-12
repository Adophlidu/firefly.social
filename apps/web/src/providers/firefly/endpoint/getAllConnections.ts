import urlcat from 'urlcat';

import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetAllConnectionsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAllConnections() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
    const response = await fireflySessionHolder.fetchWithSession<GetAllConnectionsResponse>(url);
    return formatFireflyConnections(response);
}
