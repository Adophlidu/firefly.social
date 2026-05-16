import type { Context } from 'hono';

import { FIREFLY_SOCIAL_ROOT_URL } from '@/shared/src/constants/metadata.js';
import { fetchJson } from '@/shared/src/helpers/fetchJson.js';
import { resolveResponseDataRpc } from '@/shared/src/helpers/resolveResponseData.js';
import { urlcat } from '@/shared/src/helpers/urlcat.js';
import type { ResponseJsonRpc } from '@/shared/src/types/firefly.js';

export async function fetchFireflyEndpointRpc<T>(
    method: string,
    params: Record<string, unknown>,
    c: Context,
): Promise<T> {
    try {
        const response = await fetchJson<ResponseJsonRpc<T>>(urlcat(FIREFLY_SOCIAL_ROOT_URL, '/api/rpc-firefly'), {
            method: 'POST',
            body: JSON.stringify({
                method,
                params,
            }),
            context: c,
        });
        const data = resolveResponseDataRpc(response);
        return data;
    } catch (error) {
        console.error(
            '[fetchFireflyEndpointRpc] Failed to invoke firefly endpoint rpc /api/rpc-firefly',
            JSON.stringify({
                method,
                params: JSON.stringify(params),
                error,
            }),
        );
        throw error;
    }
}
