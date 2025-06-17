import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { SignedKeyRequestBody } from '@/providers/warpcast/createSignedKey.js';
import type { ResponseJSON } from '@/types/index.js';

export interface SignedBody {
    body: SignedKeyRequestBody;
    timestamp: number;
    expiresAt: number;
}

/**
 * Create a signed key payload from a public key.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayload(key: string, signal?: AbortSignal) {
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

/**
 * Create a signed key payload from a public key with firefly sponsorship.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithSponsorship(key: string, signal?: AbortSignal) {
    const response = await fetchJSON<ResponseJSON<SignedBody>>('/api/firefly/sponsorship', {
        method: 'POST',
        signal,
        body: JSON.stringify({
            key,
        }),
    });
    if (!response.success) throw new Error(response.error.message);
    return response;
}
