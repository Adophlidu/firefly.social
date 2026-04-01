import { anySignal, requestIdleCallbackAsync } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { BaseLoader } from '@/providers/base/Loader.js';
import { type ResponseJson } from '@/types/utility.js';

export function createWorkerLoader<TData, TResponse>(
    endpoint: string,
    extract: (data: TResponse) => TData | null,
): BaseLoader<TData> {
    return new (class Loader extends BaseLoader<TData> {
        protected override fetch(url: string, signal?: AbortSignal) {
            return requestIdleCallbackAsync(async () => {
                const timeout = AbortSignal.timeout(30_000);
                const response = await fetchJson<ResponseJson<TResponse>>(
                    urlcat(FIREFLY_WORKER_HOST, endpoint, { link: url }),
                    {
                        signal: signal ? anySignal(timeout, signal) : timeout,
                    },
                );
                const data = resolveResponseData(response);
                return extract(data);
            });
        }
    })();
}
