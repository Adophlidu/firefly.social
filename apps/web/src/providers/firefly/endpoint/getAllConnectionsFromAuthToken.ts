import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import type { GetAllConnectionsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAllConnectionsFromAuthToken(authToken: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
    const response = await fetchJson<GetAllConnectionsResponse>(url, {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    return formatFireflyConnections(response);
}
