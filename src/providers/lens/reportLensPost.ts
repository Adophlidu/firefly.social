import { PostReportReason } from '@lens-protocol/client';
import { reportPost } from '@lens-protocol/client/actions';

import { reportPost as reportPostToFirefly } from '@/providers/firefly/endpoint/reportPost.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function reportLensPost(post: Post) {
    const postId = post.postId;
    await ensureLensResult(
        reportPost(lensSessionClientHolder.sessionClient, {
            post: postId,
            reason: PostReportReason.Scam, // TODO: user select reason
        }),
    );
    return reportPostToFirefly(post);
}
