import { repost } from '@lens-protocol/client/actions';

import { ensurePostToLensResult } from '@/providers/lens/ensurePostToLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function mirrorLensPost(postId: string): Promise<string> {
    const result = await ensurePostToLensResult(
        repost(lensSessionClientHolder.sessionClient, {
            post: postId,
        }),
        false,
    );

    return result.postId;
}
