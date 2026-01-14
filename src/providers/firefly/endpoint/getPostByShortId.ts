import { NotFoundError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type CastResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getPostByShortId(shortId: string, handle: string, profileId?: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast', {
        hash: shortId,
        fid: profileId,
        needRootParentHash: true,
        hashHandle: handle,
    });
    const { data: cast } = await fireflySessionHolder.fetch<CastResponse>(url);

    const post = cast ? formatFarcasterPostFromFirefly(cast) : null;
    if (!post) throw new NotFoundError('Post not found');
    return post;
}
