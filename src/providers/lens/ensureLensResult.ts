import type { PostResult, Result, ResultAsync, UnauthenticatedError, UnexpectedError } from '@lens-protocol/client';

import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function ensureLensResult<T, E>(asyncResult: ResultAsync<T, E>) {
    const result = await asyncResult;
    if (!result.isOk()) {
        throw result.error;
    }

    return result.value;
}

export function ensureLensResultSync<T, E>(result: Result<T, E>) {
    if (!result.isOk()) {
        throw result.error;
    }

    return result.value;
}

export async function ensurePostToLensResult(
    asyncResult: ResultAsync<PostResult, UnauthenticatedError | UnexpectedError>,
    pollingPost = true,
) {
    const result = await ensureLensResult(asyncResult);
    const txHash = await handleOperationWithLensChain(result);

    if (!pollingPost) {
        return { postId: '' };
    }

    const post = await LensSocialMediaProvider.getPostByTxHashWithPolling(txHash);
    if (!post) {
        throw new Error('Post not found');
    }

    return { postId: post.postId };
}
