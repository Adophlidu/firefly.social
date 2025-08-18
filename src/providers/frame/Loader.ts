import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { anySignal } from '@/helpers/anySignal.js';
import { fetchCachedJSON } from '@/helpers/fetchJson.js';
import { requestIdleCallbackAsync } from '@/helpers/requestIdleCallbackAsync.js';
import { BaseLoader } from '@/providers/base/Loader.js';
import { resolveResponseData } from '@/providers/bsky/resolveResponseData.js';
import type { Frame, LinkDigestedResponse } from '@/types/frame.js';
import type { ResponseJson } from '@/types/utility.js';

class Loader extends BaseLoader<Frame> {
    protected override fetch(url: string, signal?: AbortSignal) {
        return requestIdleCallbackAsync(async () => {
            const timeout = AbortSignal.timeout(30_000);
            const response = await fetchCachedJSON<ResponseJson<LinkDigestedResponse>>(
                urlcat(FIREFLY_WORKER_HOST, '/frame', { link: url }),
                {
                    signal: signal ? anySignal(timeout, signal) : timeout,
                },
            );
            const data = resolveResponseData(response);
            return data.frame;
        });
    }
}

export const FrameLoader = new Loader();
