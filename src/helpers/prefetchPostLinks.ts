import { uniq } from 'lodash-es';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { GetClassifyPostLinksResponse } from '@/services/getClassifyPostLink.js';

export async function prefetchPostLinks(urls: string[]) {
    return runInSafeAsync(async () => {
        const notCachedUrls = uniq(urls).filter((url) => {
            const data = queryClient.getQueryData(['classify-post-link', url]);
            return !data;
        });
        if (notCachedUrls.length <= 0) return;

        const response = await fetchJson<GetClassifyPostLinksResponse>(
            urlcat(FIREFLY_WORKER_HOST, '/og', {
                'cache-urls': notCachedUrls.join(','),
            }),
        );
        if (!response.success) return;

        for (const item of response.data) {
            if (!item.result) continue;
            queryClient.setQueryData(['classify-post-link', item.url], item.result);
        }
    });
}
