import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function checkCustodyWallet(fid: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/checkCustodyWallet', {
        fid,
    });
    const response = await fireflySessionHolder.fetchWithSession<Response<boolean>>(url);
    const data = resolveFireflyResponseData(response);
    return data;
}
