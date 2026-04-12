import { NotFoundError } from '@dimensiondev/utils';
import { fetchPost } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensPostV3 } from '@/providers/lens/formatLensPost.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export async function getLensPostById(postId: string, isLegacy = false): Promise<Post> {
    const result = await ensureLensResult(
        fetchPost(getLensClient(), isLegacy ? { legacyId: postId } : { post: postId }),
    );
    if (!result) throw new NotFoundError('No post found');

    return formatLensPostV3(result);
}
