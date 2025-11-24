import type { PostResult, ResultAsync, UnauthenticatedError, UnexpectedError } from '@lens-protocol/client';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getPostByTxHashWithPolling } from '@/providers/lens/getPostByTxHashWithPolling.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';

export async function ensurePostToLensResult(
    asyncResult: ResultAsync<PostResult, UnauthenticatedError | UnexpectedError>,
    pollingPost = true,
) {
    const result = await ensureLensResult(asyncResult);
    const txHash = await handleOperationWithLensChain(result);

    if (!pollingPost) return { postId: '' };

    const post = await getPostByTxHashWithPolling(txHash);
    if (!post) throw new Error('Post not found');

    return { postId: post.postId };
}
