import { compact } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { readChars } from '@/helpers/chars.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { ETH_ZERO_ADDRESS } from '@/helpers/isZeroAddress.js';
import { resolveMediaObjectUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { type CompositePost } from '@/types/compose.js';

export function createDummyPost(source: SocialSource, content: string, url?: string, urls?: string[]) {
    return {
        postId: source === Source.Farcaster ? ETH_ZERO_ADDRESS : '',
        publicationId: '',
        source,
        author: createDummyProfile(source),
        metadata: {
            locale: 'en',
            content: {
                oembedUrl: url,
                oembedUrls: urls,
                content,
            },
        },
    } satisfies Post;
}

export function createDummyCommentPost(source: SocialSource, compositePost: CompositePost): Post | null {
    const parentPost = compositePost.parentPost[source];
    const postId = compositePost.postId[source];
    if (!parentPost || !postId) return null;
    return {
        publicationId: crypto.randomUUID(),
        type: 'Comment',
        source,
        postId,
        parentPostId: parentPost.postId,
        parentAuthor: parentPost.author,
        timestamp: Date.now(),
        author: createDummyProfile(source),
        mediaObjects: compact([...compositePost.videos, ...compositePost.images, ...compositePost.images]).map((x) => ({
            title: x.file.name,
            mimeType: x.mimeType,
            url: resolveMediaObjectUrl(x),
        })),
        metadata: {
            locale: '',
            content: {
                content: readChars(compositePost.chars),
            },
        },
    };
}
