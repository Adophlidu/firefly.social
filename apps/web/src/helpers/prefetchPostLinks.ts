import { runInSafeAsync } from '@dimensiondev/utils';
import { uniq } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { ogWorker } from '@/providers/firefly/worker/clients.js';

export async function prefetchPostLinks(urlGroups: string[][]) {
    return runInSafeAsync(async () => {
        const notCachedUrls = uniq(urlGroups).filter((urls) => {
            if (!urls.length) return false;
            const data = queryClient.getQueryData(['classify-post-links', ...urls]);
            return !data;
        });
        if (notCachedUrls.length <= 0) return;

        const res = await ogWorker.og['cache-urls'].$get({ query: { 'cache-urls': notCachedUrls.join(',') } });
        if (!res.ok) return;
        const response = await res.json();
        if (!response.success) return;

        for (const urls of urlGroups) {
            const results = response.data.filter((x) => x.result && urls.includes(x.url));
            if (results.length) {
                queryClient.setQueryData(['classify-post-links', ...urls], results);
            }
        }
    });
}
