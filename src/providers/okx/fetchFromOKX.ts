import { NODE_ENV } from '@dimensiondev/envs';

import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';

/** request okx official API, and normalize the code */
export async function fetchFromOKX<T extends { code: number }>(input: RequestInfo | URL, init?: RequestInit) {
    if (process.env.NODE_ENV === NODE_ENV.Development) {
        if (typeof input === 'string' && input.includes('0x00000')) {
            logger.warn('Do you forget to convert to okx native address?', input);
        }
    }
    const response = await fetchJson<T>(input, init);
    return {
        ...response,
        code: +response.code,
    };
}
