import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { formatOrbPoll } from '@/helpers/formatOrbPoll.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { type OrbPoll } from '@/providers/orb/type.js';
import { type ResponseJson } from '@/types/utility.js';

export async function getPoll(postId: string, profileId?: string) {
    const url = urlcat('/api/orb/poll/get', { postId, profileId });
    const response = await fetchJson<ResponseJson<OrbPoll>>(url);
    const data = resolveResponseData(response, 'Failed to get poll.');

    return formatOrbPoll(data);
}
