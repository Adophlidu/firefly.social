import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { CreateCloudDraftRequest, CreateCloudDraftResponse } from '@/providers/types/CloudDraft.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function createCloudDraft(request: CreateCloudDraftRequest) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/ff_post/cloud_draft');
    const response = await fireflySessionHolder.fetchWithSession<Response<CreateCloudDraftResponse>>(url, {
        method: 'POST',
        body: JSON.stringify(request),
    });
    return resolveFireflyResponseData(response);
}
