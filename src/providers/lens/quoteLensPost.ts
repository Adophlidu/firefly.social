import { post } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensurePostToLensResult } from '@/providers/lens/ensurePostToLensResult.js';
import { formatLensPostRules } from '@/providers/lens/formatLensPostRules.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function quoteLensPost(postId: string, draftPost: Post): Promise<{ postId: string }> {
    const intro = draftPost.metadata.content?.content ?? '';
    return ensurePostToLensResult(
        post(lensSessionClientHolder.sessionClient, {
            contentUri: intro,
            quoteOf: { post: postId },
            rules: formatLensPostRules(draftPost.restrictions),
            feed: draftPost.channel?.id ? safeEvmAddress(draftPost.channel.id) : undefined,
        }),
    );
}
