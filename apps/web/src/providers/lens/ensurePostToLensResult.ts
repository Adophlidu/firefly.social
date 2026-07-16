import type { PostResult, ResultAsync, UnauthenticatedError, UnexpectedError } from '@lens-protocol/client';

import { LensClubGatedError } from '@/constants/error.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { getPostByTxHashWithPolling } from '@/providers/lens/getPostByTxHashWithPolling.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { resolveClubGateAddress } from '@/providers/lens/resolveClubGateAddress.js';

export async function ensurePostToLensResult(
    asyncResult: ResultAsync<PostResult, UnauthenticatedError | UnexpectedError>,
    pollingPost = true,
) {
    const result = await ensureLensResult(asyncResult);

    // Surface a club-membership gate distinctly instead of falling into the
    // generic rule-violation error (FW-7874).
    if (result.__typename === 'PostOperationValidationFailed') {
        const clubAddress = resolveClubGateAddress(result.unsatisfiedRules);
        if (clubAddress) throw new LensClubGatedError(clubAddress, { cause: result.reason });
    }

    const txHash = await handleOperationWithLensChain(result);

    if (!pollingPost) return { postId: '' };

    const post = await getPostByTxHashWithPolling(txHash);
    if (!post) throw new Error('Post not found');

    return { postId: post.postId };
}
