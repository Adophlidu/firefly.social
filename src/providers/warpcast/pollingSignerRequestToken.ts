import urlcat from 'urlcat';

import { fetchJSON } from '@/helpers/fetchJSON.js';
import { retry } from '@/helpers/retry.js';
import type { SignedKeyRequestResponse } from '@/providers/types/Warpcast.js';
import type { ResponseJson } from '@/types/index.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';

export async function pollingSignerRequestToken(token: string, signal?: AbortSignal) {
    const query = async () => {
        const response = await fetchJSON<ResponseJson<SignedKeyRequestResponse>>(
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
