import { uniq } from 'lodash-es';
import urlcat from 'urlcat';

import type { GetClassifyPostLinkOnActionResult } from '@/app/api/post-link/route.js';
import { queryClient } from '@/configs/queryClient.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { deserializeClassifyPostLinkResult } from '@/services/getClassifyPostLinkWithDeserialization.js';
import type { ResponseJSON } from '@/types/index.js';

export async function prefetchPostLinks(urls: string[]) {
    return runInSafeAsync(async () => {
        const notCachedUrls = uniq(urls).filter((url) => {
            const data = queryClient.getQueryData(['classify-post-link', url]);
            return !data;
        });
        if (notCachedUrls.length <= 0) return;
        const response = await fetchJSON<
            ResponseJSON<Array<{ url: string; result: GetClassifyPostLinkOnActionResult }>>
        >(
            urlcat(`/api/post-link`, {
                'cache-urls': notCachedUrls.join(','),
            }),
        );
        if (!response.success) return;
        for (const { url, result } of response.data) {
            queryClient.setQueryData(['classify-post-link', url], await deserializeClassifyPostLinkResult(result));
        }
    });
}
