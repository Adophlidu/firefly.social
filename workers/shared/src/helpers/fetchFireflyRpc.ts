import type { Context } from 'hono';

import { FIREFLY_SOCIAL_ROOT_URL } from '@/shared/src/constants/metadata.js';
import type { SocialSourceInURL } from '@/shared/src/constants/source.js';
import { fetchJson } from '@/shared/src/helpers/fetchJson.js';
import { resolveResponseDataRpc } from '@/shared/src/helpers/resolveResponseData.js';
import { urlcat } from '@/shared/src/helpers/urlcat.js';
import type { ResponseJsonRpc } from '@/shared/src/types/firefly.js';

export async function fetchFireflyRpc<T>(
    source: SocialSourceInURL,
    method: string,
    params: Record<string, unknown>,
    c: Context,
): Promise<T> {
    try {
        const response = await fetchJson<ResponseJsonRpc<T>>(urlcat(FIREFLY_SOCIAL_ROOT_URL, '/api/rpc'), {
            method: 'POST',
            body: JSON.stringify({
                method,
                source,
                params,
            }),
            context: c,
        });
        const data = resolveResponseDataRpc(response);
        return data;
    } catch (error) {
        console.error(
            '[fetchFireflyRpc] Failed to invoke firefly rpc /api/rpc',
            JSON.stringify({
                method,
                source,
                params: JSON.stringify(params),
            }),
            error,
        );
        throw error;
    }
}
