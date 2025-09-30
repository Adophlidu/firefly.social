import { uniq } from 'lodash-es';
import urlcat from 'urlcat';

import type { GetClassifyPostLinkOnActionResult } from '@/app/api/post-link/getClassifyPostLink.js';
import { deserializeClassifyPostLinkResult } from '@/app/api/post-link/getClassifyPostLinkWithDeserialization.js';
import { queryClient } from '@/configs/queryClient.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import type { ResponseJson } from '@/types/utility.js';

type PostLinkResponse = ResponseJson<Array<{ url: string; result: GetClassifyPostLinkOnActionResult }>>;

export async function prefetchPostLinks(urls: string[]) {
    return runInSafeAsync(async () => {
        const notCachedUrls = uniq(urls).filter((url) => {
            const data = queryClient.getQueryData(['classify-post-link', url]);
            return !data;
        });
        if (notCachedUrls.length <= 0) return;

        const url = urlcat(`/api/post-link`, {
            'cache-urls': notCachedUrls.join(','),
        });
        const response = await fetchJson<PostLinkResponse>(url);
        const data = resolveResponseData(response);
        for (const { url, result } of data) {
            queryClient.setQueryData(['classify-post-link', url], await deserializeClassifyPostLinkResult(result));
        }
    });
}
