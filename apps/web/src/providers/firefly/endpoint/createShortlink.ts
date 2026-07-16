import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface ShortlinkRecord {
    code: string;
    shortlink: string;
}

/** Creates a Shortlink for an allowlisted HTTPS destination. Requires a logged-in session. */
export async function createShortlink(url: string): Promise<ShortlinkRecord> {
    const requestUrl = urlcat(settings.FIREFLY_ROOT_URL, '/v1/shortlinks');
    const response = await fireflySessionHolder.fetch<Response<ShortlinkRecord>>(requestUrl, {
        method: 'POST',
        body: JSON.stringify({ url }),
    });
    return resolveFireflyResponseData(response);
}
