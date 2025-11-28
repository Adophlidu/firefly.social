import { compose, once } from '@dimensiondev/utils';
import type { NextRequest } from 'next/server.js';
import { z } from 'zod';

import { KeyType } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { getSearchParamsWithZodSchema } from '@/helpers/getSearchParamsWithZodSchema.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getLensThreadByPostId } from '@/providers/lens/getLensThreadByPostId.js';

const getThreadByPostId = memoizeWithRedis(getLensThreadByPostId, {
    key: KeyType.GetLensThreadByPostId,
    resolver: (postId) => postId,
});

const refreshThreadByPostId = once(
    async (postId: string) => {
        await getThreadByPostId.cache.delete(postId);
        await getLensThreadByPostId(postId);
    },
    {
        resolver: (postId) => postId,
    },
);

const SearchParamsSchema = z.object({ id: z.string() });

export const GET = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { id } = getSearchParamsWithZodSchema(request, SearchParamsSchema);

    const thread = await getThreadByPostId(id);
    return createSuccessResponseJson(thread);
});

export const PUT = compose(withRequestErrorHandler(), async (request: NextRequest) => {
    const { id } = getSearchParamsWithZodSchema(request, SearchParamsSchema);

    try {
        await refreshThreadByPostId(id);
        return createSuccessResponseJson(null);
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error, 'Failed to revalidate thread.'), {
            status: 502,
        });
    }
});
