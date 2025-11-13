import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { PrivySignMessageResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function signMessageWithPrivy(message: string, encoding = 'utf-8') {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/privy/eth/personal-sign');
    const response = await fireflySessionHolder.fetchWithSession<PrivySignMessageResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            message,
            encoding,
        }),
    });

    return resolveFireflyResponseData(response);
}
