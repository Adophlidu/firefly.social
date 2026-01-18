import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getPostById } from '@/providers/firefly/farcaster-hub/getPostById.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type ThreadResponse } from '@/providers/types/Firefly.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getThreadByPostId(postId: string, localPost?: Post): Promise<Post[]> {
    return farcasterSessionHolder.withSession(async (session) => {
        const post = localPost ?? (await getPostById(postId));

        const response = await fireflySessionHolder.fetch<ThreadResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast/threads', {
                sourceFid: session?.profileId,
                hash: postId,
                maxDepth: 25,
            }),
        );
        const data = resolveFireflyResponseData(response);
        const posts = data.threads.map((x) => formatFarcasterPostFromFirefly(x));
        return [post, ...posts];
    });
}
