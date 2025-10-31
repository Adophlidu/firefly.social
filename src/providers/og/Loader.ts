import { anySignal } from '@firefly/utils';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchCachedJSON } from '@/helpers/fetchJson.js';
import { requestIdleCallbackAsync } from '@/helpers/requestIdleCallbackAsync.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { BaseLoader } from '@/providers/base/Loader.js';
import type { LinkDigested, OpenGraph } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

class Loader extends BaseLoader<OpenGraph> {
    protected override fetch(url: string, signal?: AbortSignal) {
        return requestIdleCallbackAsync(async () => {
            const timeout = AbortSignal.timeout(30_000);
            const response = await fetchCachedJSON<ResponseJson<LinkDigested>>(
                urlcat(FIREFLY_WORKER_HOST, '/oembed', { link: url }),
                {
                    signal: signal ? anySignal(timeout, signal) : timeout,
                },
            );
            const data = resolveResponseData(response);
            return data.og;
        });
    }
}

export const OpenGraphLoader = new Loader();
