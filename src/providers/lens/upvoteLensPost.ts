import { unreachable } from '@dimensiondev/utils';
import { PostReactionType } from '@lens-protocol/client';
import { addReaction } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function upvoteLensPost(postId: string) {
    const result = await ensureLensResult(
        addReaction(lensSessionClientHolder.sessionClient, { post: postId, reaction: PostReactionType.Upvote }),
    );
    switch (result.__typename) {
        case 'AddReactionResponse':
            if (!result.success) {
                throw new Error(`Failed to upvote`);
            }
            break;
        case 'AddReactionFailure':
            throw new Error(`Failed to upvote`);
        default:
            unreachable(result);
    }
}
