import type { NextRequest } from 'next/server.js';

import { KeyType } from '@/constants/enum.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { once } from '@/helpers/once.js';
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

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return createErrorResponseJSON('Missing id', { status: 400 });

    const thread = await getThreadByPostId(id);
    return createSuccessResponseJSON(thread);
}

export async function PUT(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return createErrorResponseJSON('Missing id', { status: 400 });

    try {
        await refreshThreadByPostId(id);
        return createSuccessResponseJSON(null);
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error, 'Failed to revalidate thread.'), {
            status: 502,
        });
    }
}
