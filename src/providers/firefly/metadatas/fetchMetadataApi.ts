import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

export function fetchMetadataApi(pathname: string, init?: RequestInit) {
    return fetchJson<ResponseJson<Metadata>>(urlcat(FIREFLY_WORKER_HOST, pathname), {
        ...init,
        headers: {
            ...init?.headers,
            'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false',
        },
    });
}
