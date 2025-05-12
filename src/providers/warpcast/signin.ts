import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { SignedKeyRequestBody } from '@/providers/warpcast/signedKeyRequests.js';
import type { ResponseJSON } from '@/types/index.js';

export interface SignedBody {
    body: SignedKeyRequestBody;
    timestamp: number;
    expiresAt: number;
}

export async function signin(key: string, signal?: AbortSignal) {
    const response = await fetchJSON<ResponseJSON<SignedBody>>('/api/warpcast/signin', {
        method: 'POST',
        body: JSON.stringify({
            key,
        }),
        signal,
    });
    if (!response.success) throw new Error(response.error.message);
    return response;
}
