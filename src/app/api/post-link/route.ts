import { compact } from 'lodash-es';
import type { NextRequest } from 'next/server.js';

import {
    type GetClassifyPostLinkOnActionResult,
    getClassifyPostLinkWithRedis,
} from '@/app/api/post-link/getClassifyPostLink.js';
import { compose } from '@/helpers/compose.js';
import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
        const result = await getClassifyPostLinkWithRedis(url).catch(() => null);
        return createSuccessResponseJson(result);
    }
    const urls = request.nextUrl.searchParams.get('cache-urls')?.split(',');
    if (urls) {
        const cacheResults = await Promise.allSettled(
            urls.map(async (url) => ({ url, result: await getClassifyPostLinkWithRedis.cache.get(url) })),
        );
        const results = compact(
            cacheResults
                .map((x) =>
                    x.status === 'fulfilled'
                        ? { result: x.value.result as GetClassifyPostLinkOnActionResult, url: x.value.url }
                        : null,
                )
                .filter((x) => x?.result),
        );
        return createSuccessResponseJson(results);
    }
    return createSuccessResponseJson(null);
});

export const POST = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const urls = await request.json();
    if (!Array.isArray(urls)) return createSuccessResponseJson([]);

    const results = await Promise.allSettled(
        urls.map(async (url) => ({ url, result: await getClassifyPostLinkWithRedis(url) })),
    );

    return createSuccessResponseJson(compact(results.map((x) => (x.status === 'fulfilled' ? x.value : null))));
});

export const DELETE = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const url = request.nextUrl.searchParams.get('url');
    if (url) {
        await getClassifyPostLinkWithRedis.cache.delete(url);
        return createSuccessResponseJson(true);
    }
    return createSuccessResponseJson(false);
});
