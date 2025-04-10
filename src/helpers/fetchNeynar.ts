import { env } from '@/constants/env.js';
import { NOT_DEPEND_SECRET } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { type NextFetchersOptions } from '@/helpers/getNextFetchers.js';

const API_KEY_HEADER_NAME = 'x-api-key';

export function fetchNeynarJSON<T>(url: string, init: RequestInit, options?: NextFetchersOptions): Promise<T> {
    const headers = {
        'Content-Type': 'application/json',
        ...init.headers,
        [API_KEY_HEADER_NAME]: NOT_DEPEND_SECRET,
    };

    if (env.internal.HUBBLE_TOKEN) {
        headers[API_KEY_HEADER_NAME] = env.internal.HUBBLE_TOKEN;
    } else if (env.external.NEXT_PUBLIC_HUBBLE_TOKEN) {
        headers[API_KEY_HEADER_NAME] = env.external.NEXT_PUBLIC_HUBBLE_TOKEN;
    } else {
        throw new Error('token not found.');
    }

    return fetchJSON(
        url,
        {
            ...init,
            headers,
        },
        options,
    );
}
