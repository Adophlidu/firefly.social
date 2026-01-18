import { NotFoundError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type CastResponse } from '@/providers/types/Firefly.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getPostById(postId: string): Promise<Post> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast', {
            hash: postId,
            fid: session?.profileId,
            needRootParentHash: true,
        });
        const { data: cast } = await fireflySessionHolder.fetch<CastResponse>(url);

        const post = cast ? formatFarcasterPostFromFirefly(cast) : null;
        if (!post) throw new NotFoundError(`Farcaster post not found with postId=${postId}.`);
        return post;
    });
}
