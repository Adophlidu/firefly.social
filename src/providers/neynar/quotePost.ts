import { EMPTY_LIST } from '@dimensiondev/constants';
import { toInteger } from 'lodash-es';
import { toHex } from 'viem';

import { MessageType } from '@/constants/farcaster.js';
import { farcasterPostIdToHash } from '@/providers/farcaster/farcasterPostIdToHash.js';
import { getAllMentionsForFarcaster } from '@/providers/farcaster/getAllMentionsForFarcaster.js';
import { publishMessage } from '@/providers/firefly/farcaster-hub/publishMessage.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import { type CastResponse } from '@/providers/types/Neynar.js';
import { type Notification, type Post } from '@/providers/types/SocialMedia.js';

export async function quotePost(postId: string, post: Post, authorId?: number): Promise<{ postId: string }> {
    const result = await getAllMentionsForFarcaster(post.metadata.content?.content ?? '');
    if (!postId || !post || !authorId) throw new Error('Failed to quote post.');

    const { messageJson } = await encodeMessageData({
        type: MessageType.CAST_ADD,
        castAddBody: {
            ...result,
            embedsDeprecated: EMPTY_LIST,
            embeds: [
                {
                    castId: {
                        fid: authorId,
                        hash: farcasterPostIdToHash(postId),
                    },
                },
                ...(post.mediaObjects?.map((v) => ({ url: v.url })) ?? []),
            ],
            parentCastId:
                post.commentOn?.postId && post.commentOn?.author.profileId
                    ? {
                          fid: toInteger(post.commentOn.author.profileId),
                          hash: farcasterPostIdToHash(post.commentOn.postId),
                      }
                    : undefined,
            parentUrl:
                !(post.commentOn?.postId && post.commentOn?.author.profileId) && post.parentChannelUrl
                    ? post.parentChannelUrl
                    : undefined,
        },
    });
    const { hash } = await publishMessage<CastResponse>(messageJson);
    return { postId: toHex(new Uint8Array(hash.data)) };
}
