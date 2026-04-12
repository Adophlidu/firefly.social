import { compose } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';

import { createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getWebhookMessagesByUserId } from '@/providers/twitter/getWebhookMessagesByUserId.js';
import { withTwitterRequestErrorHandler } from '@/providers/twitter/withTwitterRequestErrorHandler.js';
import { SearchPageable } from '@/schemas/Pageable.js';

export const GET = compose(
    withTwitterRequestErrorHandler,
    withRequestErrorHandler({ throwError: true }),
    async (request: NextRequest) => {
        const { cursor, limit, query } = getSearchParamsWithZodSchema(request, SearchPageable);
        const result = await getWebhookMessagesByUserId(query, {
            cursor: cursor && !Number.isNaN(+cursor) ? Number(cursor) : undefined,
            size: limit,
        });

        return createSuccessResponseJson(result);
    },
);
