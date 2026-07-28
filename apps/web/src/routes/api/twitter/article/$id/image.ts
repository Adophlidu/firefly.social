import type { ApiContext } from '@dimensiondev/ssr';
import type { NextRequestContext } from '@dimensiondev/types';
import { compose } from '@dimensiondev/utils';
import { z } from 'zod';

import type { NextRequest } from '@/compat/next-server.js';
import { createProxyImageResponse } from '@/helpers/createProxyImageResponse.js';
import { createErrorResponseJson } from '@/helpers/createResponseJson.js';
import { getParamsWithZodSchema } from '@/helpers/getParamsWithZodSchema.js';
import { qAny } from '@/helpers/q.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { parseHtml } from '@/libs/parseHtml.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';

const ParamsSchema = z.object({ id: z.string() });

function getImageUrl(document: Document): string | null {
    const meta = qAny(document, ['lens:image', 'og:image', 'twitter:image', 'twitter:image:src']);
    return meta?.getAttribute('content') || null;
}

const getHandler = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest, context?: NextRequestContext) => {
        const { id: articleId } = await getParamsWithZodSchema(ParamsSchema, context);

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

export function GET({ request, params }: ApiContext) {
    return getHandler(request as NextRequest, { params: Promise.resolve(params) });
}
