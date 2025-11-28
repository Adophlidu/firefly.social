import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { VoteRequestOptions, VoteResponse } from '@/providers/types/Poll.js';
import { settings } from '@/settings/index.js';

export async function voteV2(options: VoteRequestOptions) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/vote_frame/poll/vote');
    const response = await fireflySessionHolder.fetchWithSession<VoteResponse>(url, {
        method: 'POST',
        body: JSON.stringify(options),
    });

    return resolveFireflyResponseData(response);
}
