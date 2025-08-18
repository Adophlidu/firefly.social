import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { retry } from '@/helpers/retry.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import type { SignedKeyRequestResponse } from '@/providers/types/Warpcast.js';
import type { ResponseJson } from '@/types/utility.js';

export async function pollingSignerRequestToken(token: string, signal?: AbortSignal) {
    const query = async () => {
        const response = await fetchJson<ResponseJson<SignedKeyRequestResponse>>(
            // CORS issue workaround: use a proxy or server-side function to handle the request
            urlcat('/api/warpcast/signed-key', {
                token,
            }),
            {
                signal,
            },
        );
        const data = resolveResponseData(response);
        return data;
    };

    const result = await retry(query, {
        times: 10,
        signal,
    });
    return result.result.signedKeyRequest;
}
