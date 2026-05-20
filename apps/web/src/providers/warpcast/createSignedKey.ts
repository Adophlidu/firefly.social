import { WARPCAST_ROOT_URL_V2 } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { SignedKeyRequestResponse } from '@/providers/types/Warpcast.js';

export interface SignedKeyRequestBody {
    key: Hex;
    keyType?: string; // "auth-address"
    requestFid: number;
    deadline: number;
    signature: Hex;
    redirectUrl?: string;
    sponsorship?: {
        sponsorFid: number;
        signature: string; // sponsorship signature by sponsorFid
    };
}

export async function createSignedKey(body: SignedKeyRequestBody, signal?: AbortSignal) {
    const url = urlcat(WARPCAST_ROOT_URL_V2, '/signed-key-requests');
    const response = await fetchJson<SignedKeyRequestResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
    });
    if (response.errors?.length) {
        throw new Error(response.errors.map((e) => e.message).join(', '));
    }

    return response.result.signedKeyRequest;
}
