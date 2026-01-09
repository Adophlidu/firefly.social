import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { ensureLensResultSync } from '@/providers/lens/ensureLensResultSync.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type VoteResult } from '@/providers/orb/type.js';
import { type ResponseJson } from '@/types/utility.js';

export async function vote(postId: string, pollOptions: number[]) {
    const credentials = ensureLensResultSync(lensSessionClientHolder.sessionClient.getCredentials());
    if (!credentials?.accessToken) {
        throw new Error('No lens access token.');
    }

    const response = await fetchJson<ResponseJson<VoteResult>>('/api/orb/poll/vote', {
        method: 'POST',
        body: JSON.stringify({
            postId,
            pollOptions,
        }),
        headers: {
            'x-access-token': `Bearer ${credentials.accessToken}`,
        },
    });
    return resolveResponseData(response, 'Failed to get poll.');
}
