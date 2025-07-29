import { encodeAbiParameters } from 'viem';

import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { SignedKeyRequestBody } from '@/providers/warpcast/createSignedKey.js';
import type { ResponseJSON } from '@/types/index.js';

type SignedBody = ResponseJSON<{
    body: SignedKeyRequestBody;
    timestamp: number;
    expiresAt: number;
}>;

/**
 * Create a signed key payload with address verification.
 * @param address
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithAddressVerification(address: `0x${string}`, signal?: AbortSignal) {
    const response = await fetchJSON<SignedBody>('/api/warpcast/signed-key-request', {
        method: 'POST',
        body: JSON.stringify({
            key: encodeAbiParameters([{ name: 'auth_address', type: 'address' }], [address]),
        }),
        signal,
    });
    if (!response.success) throw new Error(response.error.message);
    return response.data;
}

/**
 * Create a signed key payload from a public key.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithPublicKey(key: string, signal?: AbortSignal) {
    const response = await fetchJSON<SignedBody>('/api/warpcast/signed-key-request', {
        method: 'POST',
        body: JSON.stringify({
            key,
        }),
        signal,
    });
    if (!response.success) throw new Error(response.error.message);
    return response.data;
}

/**
 * Create a signed key payload from a public key with firefly sponsorship.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithSponsorship(key: string, signal?: AbortSignal) {
    const response = await fetchJSON<SignedBody>('/api/firefly/sponsorship', {
        method: 'POST',
        signal,
        body: JSON.stringify({
            key,
        }),
    });
    if (!response.success) throw new Error(response.error.message);
    return response.data;
}
