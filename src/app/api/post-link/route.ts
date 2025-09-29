import { compact } from 'lodash-es';
import type { NextRequest } from 'next/server.js';

import { getClassifyPostLink } from '@/app/api/post-link/getClassifyPostLink.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
        const result = await getClassifyPostLink(url).catch(() => null);
        return createSuccessResponseJson(result);
    }
    const urls = request.nextUrl.searchParams.get('cache-urls')?.split(',');
    if (urls) {
        const allSettled = await Promise.allSettled(
            urls.map(async (url) => ({ url, result: await getClassifyPostLink(url) })),
        );
        const results = compact(
            allSettled
                .map((x) => (x.status === 'fulfilled' ? { result: x.value.result, url: x.value.url } : null))
                .filter((x) => x?.result),
        );
        return createSuccessResponseJson(results);
    }
    return createSuccessResponseJson(null);
});
