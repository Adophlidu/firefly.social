import { post } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensurePostToLensResult } from '@/providers/lens/ensurePostToLensResult.js';
import { formatLensPostRules } from '@/providers/lens/formatLensPostRules.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Notification, type Post } from '@/providers/types/SocialMedia.js';

export async function publishLensPost(draftPost: Post): Promise<{ postId: string }> {
    if (!draftPost.metadata.contentURI) throw new Error('No content to publish.');

    return ensurePostToLensResult(
        post(lensSessionClientHolder.sessionClient, {
            contentUri: draftPost.metadata.contentURI,
            rules: formatLensPostRules(draftPost.restrictions),
            feed: draftPost.channel?.feedId ? safeEvmAddress(draftPost.channel.feedId) : undefined,
        }),
    );
}
