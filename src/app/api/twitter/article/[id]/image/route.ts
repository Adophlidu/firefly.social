import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { MalformedError } from '@/constants/error.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { parseHtml } from '@/helpers/parseHtml.js';
import { qAny } from '@/helpers/q.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import type { NextRequestContext } from '@/types/utility.js';

function getImageUrl(document: Document): string | null {
    const meta = qAny(document, ['lens:image', 'og:image', 'twitter:image', 'twitter:image:src']);
    return meta?.getAttribute('content') || null;
}

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest, context?: NextRequestContext) => {
        const articleId = (await context?.params)?.id;
        if (!articleId) throw new MalformedError('articleId not found');

        // simulate bot request to get og image
        const response = await fetch(`https://x.com/SingularityDAO/status/${articleId}`, {
            headers: {
                'User-Agent': 'Bot',
            },
        });

        if (!response.ok || (response.status >= 500 && response.status < 600)) {
            return createErrorResponseJson('article not found');
        }

        const html = await response.text();
        const document = parseHtml(html);
        const imageUrl = getImageUrl(document);
        if (!imageUrl) {
            return createErrorResponseJson('article not found');
        }
        return createProxyImageResponse(imageUrl);
    },
);
