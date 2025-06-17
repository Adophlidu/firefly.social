import { type Address, pad } from 'viem';

import { NotAllowedError } from '@/constants/error.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
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
export async function createSignedKeyPayloadWithPublicKey(key: string, signal?: AbortSignal) {
    const response = await fetchJSON<ResponseJSON<SignedBody>>('/api/warpcast/signin', {
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
    const response = await fetchJSON<ResponseJSON<SignedBody>>('/api/firefly/sponsorship', {
        method: 'POST',
        signal,
        body: JSON.stringify({
            key,
        }),
    });
    if (!response.success) throw new Error(response.error.message);
    return response.data;
}

/**
 * Learn more: https://warpcast.notion.site/Public-Auth-Address-Implementation-Guide-1fc6a6c0c10180a9b2a7f24c71143eae
 * @param address
 * @param fid
 * @param signal
 * @returns
 */
export async function createSignedKeyPayloadWithAuthAddress(address: string, fid: number, signal?: AbortSignal) {
    if (!isValidAddressEthereum(address)) throw new NotAllowedError('Invalid Ethereum address');

    const payload = await createSignedKeyPayloadWithPublicKey(pad(address as Address, { size: 32 }), signal);
    return {
        ...payload,
        requestFid: fid,
        keyType: 'auth-address',
    };
}
