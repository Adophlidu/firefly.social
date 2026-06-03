import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createBatcher } from '@dimensiondev/utils';

import { getPostPublishInfoFromFirefly } from '@/providers/firefly/endpoint/getPostPublishInfoFromFirefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface PostPayload {
    source: SocialSource;
    postId: string;
}

function makeKey(source: SocialSource, postId: string) {
    return `${source}:${postId}`;
}

async function fetcher(payloads: PostPayload[]): Promise<Record<string, boolean>> {
    if (payloads.length === 0) return {};

    // The endpoint accepts a single platform per request, so group post ids by source.
    const idsBySource = new Map<SocialSource, string[]>();
    for (const { source, postId } of payloads) {
        const ids = idsBySource.get(source);
        if (ids) ids.push(postId);
        else idsBySource.set(source, [postId]);
    }

    const records = await Promise.all(
        Array.from(idsBySource, async ([source, postIds]) => {
            const record = await getPostPublishInfoFromFirefly(source, postIds);
            return [source, record] as const;
        }),
    );

    const result: Record<string, boolean> = {};
    for (const [source, record] of records) {
        if (!record?.posts) continue;
        for (const [postId, published] of Object.entries(record.posts)) {
            result[makeKey(source, postId)] = published;
        }
    }

    return result;
}

const batchedCheck = createBatcher<PostPayload, boolean>('getPostPublishInfoFromFirefly', fetcher, {
    makeKey: (payload) => makeKey(payload.source, payload.postId),
    size: 100,
    wait: 100,
});

export async function getPostPublishPlatformInfo(post: Post): Promise<{
    name: string;
} | null> {
    const postId = post.source === Source.Bsky ? post.publicationId : post.postId;

    const published = await batchedCheck({ source: post.source, postId });
    if (published === true) return { name: 'Firefly' };

    return null;
}
