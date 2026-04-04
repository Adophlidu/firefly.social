import dayjs from 'dayjs';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { getPostByTxHashWithPolling } from '@/providers/lens/getPostByTxHashWithPolling.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type CreatePollResult } from '@/providers/orb/type.js';
import { type CompositePoll } from '@/providers/types/Poll.js';
import { type ResponseJson } from '@/types/utility.js';

export async function createPollPost(pollTitle: string, draftPoll: CompositePoll) {
    const credentials = ensureLensResultSync(lensSessionClientHolder.sessionClient.getCredentials());
    if (!credentials?.accessToken) throw new Error('No lens access token.');

    const response = await fetchJson<ResponseJson<CreatePollResult>>('/api/orb/poll/create', {
        method: 'POST',
        body: JSON.stringify({
            content: pollTitle,
            poll: {
                allowMultipleAnswers: false,
                questions: draftPoll.options.map((x) => x.label),
                endTimestamp: dayjs().add(dayjs.duration(draftPoll.duration)).valueOf(),
            },
        }),
        headers: {
            'x-access-token': `Bearer ${credentials.accessToken}`,
        },
    });
    const { hash } = resolveResponseData(response, 'Failed to create poll.');
    const post = await getPostByTxHashWithPolling(hash);
    if (!post) throw new Error('Post not found');

    return { postId: post.postId };
}
