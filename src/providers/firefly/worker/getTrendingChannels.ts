import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';
import type { ResponseJson } from '@/types/utility.js';

function fetchInterfaceApi<T>(pathname: string, init?: RequestInit) {
    return fetchJson<ResponseJson<T>>(urlcat(FIREFLY_WORKER_HOST, pathname), {
        ...init,
        headers: {
            ...init?.headers,
            'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false',
        },
    });
}

export async function getTrendingChannels() {
    const response = await fetchInterfaceApi<Channel[]>('/ui/suggested-channels');
    const channels = resolveResponseData(response);
    return channels;
}
