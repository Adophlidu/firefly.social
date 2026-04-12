import { post } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensurePostToLensResult } from '@/providers/lens/ensurePostToLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function commentLensPost(
    postId: string,
    draftPost: Post,
    signless?: boolean,
): Promise<{ postId: string }> {
    const comment = draftPost.metadata.content?.content ?? '';
    return ensurePostToLensResult(
        post(lensSessionClientHolder.sessionClient, {
            contentUri: comment,
            commentOn: { post: postId },
            feed: draftPost.channel?.id ? safeEvmAddress(draftPost.channel.id) : undefined,
        }),
    );
}
