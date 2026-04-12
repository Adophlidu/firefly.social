import { pad } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { SignedKeyRequestBody } from '@/providers/warpcast/createSignedKey.js';
import type { ResponseJson } from '@/types/utility.js';

type SignedBody = ResponseJson<{
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
    const response = await fetchJson<SignedBody>('/api/firefly/sponsorship', {
        method: 'POST',
        body: JSON.stringify({
            key: pad(address, { size: 32 }),
        }),
        signal,
    });
    const data = resolveResponseData(response);
    return data;
}

/**
 * Create a signed key payload from a public key.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithPublicKey(key: string, signal?: AbortSignal) {
    const response = await fetchJson<SignedBody>('/api/warpcast/signed-key-request', {
        method: 'POST',
        body: JSON.stringify({
            key,
        }),
        signal,
    });
    const data = resolveResponseData(response);
    return data;
}

/**
 * Create a signed key payload from a public key with firefly sponsorship.
 * @param key
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithSponsorship(key: string, signal?: AbortSignal) {
    const response = await fetchJson<SignedBody>('/api/firefly/sponsorship', {
        method: 'POST',
        signal,
        body: JSON.stringify({
            key,
        }),
    });
    const data = resolveResponseData(response);
    return data;
}
