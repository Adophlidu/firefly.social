import { once } from '@firefly/utils';
import type { NextRequest } from 'next/server.js';

import { KeyType } from '@/constants/enum.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
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
    if (!id) return createErrorResponseJson('Missing id', { status: 400 });

    const thread = await getThreadByPostId(id);
    return createSuccessResponseJson(thread);
}

export async function PUT(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return createErrorResponseJson('Missing id', { status: 400 });

    try {
        await refreshThreadByPostId(id);
        return createSuccessResponseJson(null);
    } catch (error) {
        return createErrorResponseJson(getGatewayErrorMessage(error, 'Failed to revalidate thread.'), {
            status: 502,
        });
    }
}
