import { unreachable } from '@dimensiondev/utils';
import { PostReactionType } from '@lens-protocol/client';
import { undoReaction } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function unvoteLensPost(postId: string): Promise<void> {
    const result = await ensureLensResult(
        undoReaction(lensSessionClientHolder.sessionClient, { post: postId, reaction: PostReactionType.Downvote }),
    );
    switch (result.__typename) {
        case 'UndoReactionResponse':
            if (!result.success) {
                throw new Error(`Failed to unvote`);
            }
            break;
        case 'UndoReactionFailure':
            throw new Error(`Failed to unvote`);
        default:
            unreachable(result);
    }
}
