import urlcat from 'urlcat';

import { fetchJSON } from '@/helpers/fetchJSON.js';
import { retry } from '@/helpers/retry.js';
import type { SignedKeyRequestResponse } from '@/providers/types/Warpcast.js';
import type { ResponseJSON } from '@/types/index.js';

export async function pollingSignerRequestToken(token: string, signal?: AbortSignal) {
    const query = async () => {
        const signed = await fetchJSON<ResponseJSON<SignedKeyRequestResponse>>(
            urlcat('/api/warpcast/signed-key', {
                token,
            }),
            {
                signal,
            },
        );
        if (!signed.success) throw new Error(signed.error.message);
        return signed.data;
    };

    const result = await retry(query, {
        times: 10,
        signal,
    });
    return result.result.signedKeyRequest;
}
