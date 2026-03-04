import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function deleteCloudDraft(draftId: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/ff_post/cloud_draft/:draftId', { draftId });
    const response = await fireflySessionHolder.fetchWithSession<Response<void>>(url, {
        method: 'DELETE',
    });
    return resolveFireflyResponseData(response);
}
