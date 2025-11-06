import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function signMessageWithCustodyWallet(fid: string, message: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/signMessage');
    const response = await fireflySessionHolder.fetchWithSession<Response<{ signatureMessage: string }>>(url, {
        method: 'POST',
        body: JSON.stringify({
            fid: Number.parseInt(fid, 10),
            message,
        }),
    });
    const data = resolveFireflyResponseData(response);
    return data.signatureMessage;
}
