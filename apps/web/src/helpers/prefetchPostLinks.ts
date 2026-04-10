import { runInSafeAsync } from '@dimensiondev/utils';
import { uniq } from 'lodash-es';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { type GetClassifyPostLinksResponse } from '@/providers/firefly/worker/getClassifyPostLinks.js';

export async function prefetchPostLinks(urlGroups: string[][]) {
    return runInSafeAsync(async () => {
        const notCachedUrls = uniq(urlGroups).filter((urls) => {
            if (!urls.length) return false;
            const data = queryClient.getQueryData(['classify-post-links', ...urls]);
            return !data;
        });
        if (notCachedUrls.length <= 0) return;

        const response = await fetchJson<GetClassifyPostLinksResponse>(
            urlcat(FIREFLY_WORKER_HOST, '/og', {
                'cache-urls': notCachedUrls.join(','),
            }),
        );
        if (!response.success) return;

        for (const urls of urlGroups) {
            const results = response.data.filter((x) => x.result && urls.includes(x.url));
            if (results.length) {
                queryClient.setQueryData(['classify-post-links', ...urls], results);
            }
        }
    });
}
