import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { X3_PRO_AVATAR_URL } from '@/constants/static.js';
import { formatTwitterProfileFromX3Pro } from '@/providers/twitter/formatTwitterProfileFromX3Pro.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { formatX3Id } from '@/providers/x3pro/formatX3Id.js';
import type { Post as X3ProPost } from '@/providers/x3pro/types.js';

export function formatX3ProPost(origin: X3ProPost, parent?: X3ProPost): Post {
    const postId = formatX3Id(origin.id);
    return {
        publicationId: postId,
        type: origin.originPost ? 'Quote' : 'Post',
        postId,
        parentPostId: parent?.id ? formatX3Id(parent.id) : undefined,
        parentAuthor: parent?.author ? formatTwitterProfileFromX3Pro(parent.author) : undefined,
        timestamp: origin.createTime * 1000,
        author: formatTwitterProfileFromX3Pro(origin.author),
        isHidden: false,
        metadata: {
            locale: origin.lang,
            content: {
                content: origin.content,
                truncatedContent: origin.content,
                attachments: origin.media
                    ?.filter((x) => x.type === 1)
                    .map((media) => ({
                        type: media.type === 1 ? 'Image' : 'Unknown',
                        uri: urlcat(X3_PRO_AVATAR_URL, media.path),
                    })),
            },
        },
        stats: {
            comments: origin.replyCount,
            mirrors: origin.forwardCount,
            quotes: 0,
            reactions: origin.likeCount,
        },
        source: Source.Twitter,
        canComment: true,
        canAct: false,
        canMirror: true,
        canQuote: true,
        __original__: origin,
    };
}
