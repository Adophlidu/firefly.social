import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { PollSignInResponseData } from '@/providers/orb/type.js';
import type { ResponseJson } from '@/types/utility.js';

export async function pollSignIn(secret: string, signal?: AbortSignal) {
    const response = await fetchJson<ResponseJson<PollSignInResponseData>>('/api/orb/poll-sign-in', {
        method: 'POST',
        body: JSON.stringify({ secret }),
        signal,
    });
    const data = resolveResponseData(response, 'Failed to poll sign in orb');
    return data;
}
