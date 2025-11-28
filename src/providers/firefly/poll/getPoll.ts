import urlcat from 'urlcat';

import { type SocialSource } from '@/constants/enum.js';
import { formatFireflyPoll } from '@/helpers/formatFireflyPoll.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetPollResponse, Poll } from '@/providers/types/Poll.js';
import { settings } from '@/settings/index.js';

export async function getPoll(pollId: string, source: SocialSource): Promise<Poll | null> {
    const session = getSessionFromStorageBySource(source);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/vote_frame/poll', {
        poll_id: pollId,
        platform: resolveSocialSourceInUrl(source),
        platform_id: session?.profileId,
    });

    const response = await fireflySessionHolder.fetch<GetPollResponse>(url);
    const fireflyPoll = resolveFireflyResponseData(response);

    return fireflyPoll ? formatFireflyPoll(fireflyPoll, source) : null;
}
