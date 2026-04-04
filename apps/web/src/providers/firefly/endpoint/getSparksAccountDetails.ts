import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type SparksAccountResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSparksAccountDetails(accountId: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/genesis/spark/profile');
    const response = await fireflySessionHolder.fetch<SparksAccountResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ uid: accountId }),
    });
    return resolveFireflyResponseData(response);
}
