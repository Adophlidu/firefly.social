import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { WARPCAST_ROOT_URL_V2 } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
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
    return fetchJSON<SignedKeyRequestResponse>(url, {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
    });
}
