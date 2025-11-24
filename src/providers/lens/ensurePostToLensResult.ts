import type { PostResult, ResultAsync, UnauthenticatedError, UnexpectedError } from '@lens-protocol/client';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

export async function ensurePostToLensResult(
    asyncResult: ResultAsync<PostResult, UnauthenticatedError | UnexpectedError>,
    pollingPost = true,
) {
    const result = await ensureLensResult(asyncResult);
    const txHash = await handleOperationWithLensChain(result);

    if (!pollingPost) {
        return { postId: '' };
    }

    const post = await lensSocialMediaProvider.getPostByTxHashWithPolling(txHash);
    if (!post) {
        throw new Error('Post not found');
    }

    return { postId: post.postId };
}
