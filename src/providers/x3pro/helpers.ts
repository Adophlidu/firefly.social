import { Source } from '@/constants/enum.js';
import { type Post, type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';
import type { Post as X3ProPost, Profile as X3ProProfile } from '@/providers/x3pro/types.js';

export const X3_PRO_AVATAR_HOST = 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com/';

/**
 * remove x_ prefix from post id or profile id
 */
export function formatX3Id(id: string) {
    return id.startsWith('x_') ? id.slice(2) : id;
}

function formatX3Profile(user: X3ProProfile): Profile {
    return {
        verified: false,
        status: ProfileStatus.Active,
        source: Source.Twitter,
        profileSource: Source.Twitter,
        fullHandle: user.screenName,
        profileId: formatX3Id(user.id),
        handle: user.screenName,
        displayName: user.name,
        pfp: `${X3_PRO_AVATAR_HOST}/${user.avatar}`,
        bio: user.introduction,
        followerCount: user.fanCount,
        followingCount: user.focusCount,
        viewerContext: {
            following: user.isFocus,
        },
        isPowerUser: false,
    };
}

export function formatX3ProPost(origin: X3ProPost, parent?: X3ProPost): Post {
    const postId = formatX3Id(origin.id);
    return {
        publicationId: postId,
        type: origin.originPost ? 'Quote' : 'Post',
        postId,
        parentPostId: parent?.id ? formatX3Id(parent.id) : undefined,
        parentAuthor: parent?.author ? formatX3Profile(parent.author) : undefined,
        timestamp: origin.createTime * 1000,
        author: formatX3Profile(origin.author),
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
                        uri: `${X3_PRO_AVATAR_HOST}/${media.path}`,
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
        canComment: false,
        canAct: false,
        canMirror: false,
        canQuote: false,
        __original__: origin,
    };
}
