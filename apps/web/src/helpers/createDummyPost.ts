import type { SocialSource } from '@dimensiondev/enums';
import { PostType, Source } from '@dimensiondev/enums';
import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3/constants';
import { compact } from 'lodash-es';

import { readChars } from '@/helpers/chars.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { resolveMediaObjectUrl } from '@/helpers/resolveMediaObjectUrl.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { CompositePost } from '@/types/compose.js';

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
    const currentProfile = getCurrentProfileFromStorage(source);
    if (!parentPost || !postId) return null;
    return {
        publicationId: crypto.randomUUID(),
        type: PostType.Comment,
        source,
        postId,
        parentPostId: parentPost.postId,
        parentAuthor: parentPost.author,
        timestamp: Date.now(),
        author: currentProfile || createDummyProfile(source),
        mediaObjects: compact([...compositePost.videos, ...compositePost.images, ...compositePost.images]).map((x) => ({
            title: x.file.name,
            mimeType: x.mimeType,
            url: resolveMediaObjectUrl(x),
        })),
        metadata: {
            locale: '',
            content: {
                content: readChars({ chars: compositePost.chars }),
            },
        },
    };
}
