import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { IframeBlockerResponse } from '@/types/frame.js';
import type { ResponseJson } from '@/types/utility.js';

export async function checkMiniAppBlocking(link: string, signal?: AbortSignal) {
    const url = urlcat(FIREFLY_WORKER_HOST, '/iframe-blocker/check', { link });
    const response = await fetchJson<ResponseJson<IframeBlockerResponse>>(url, { signal });
    return response.success ? response.data : null;
}
