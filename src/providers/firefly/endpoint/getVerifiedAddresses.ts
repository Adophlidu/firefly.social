import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetVerifiedAddressesResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getVerifiedAddresses(): Promise<GetVerifiedAddressesResponse> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/accountConnection');
    const response = await fireflySessionHolder.fetchWithSession<GetVerifiedAddressesResponse>(url, {
        method: 'GET',
    });
    return response;
}
