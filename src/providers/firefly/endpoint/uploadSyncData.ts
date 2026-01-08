'use client';

import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type DesktopLinkInfoStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function uploadSyncData(session: string, encryptedData: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/sync/uploadData');
    const response = await fireflySessionHolder.fetchWithSession<DesktopLinkInfoStatusResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ session, encryptedData }),
    });
    return resolveFireflyResponseData(response);
}
