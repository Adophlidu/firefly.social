import urlcat from 'urlcat';

import { type SocialSourceInURL } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function deleteCloudDraft(draftId: string, platforms?: SocialSourceInURL[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/ff_post/cloud_draft/:draftId', {
        draftId,
        platform: platforms?.join(','),
    });
    const response = await fireflySessionHolder.fetchWithSession<Response<void>>(url, {
        method: 'DELETE',
    });
    return resolveFireflyResponseData(response);
}
