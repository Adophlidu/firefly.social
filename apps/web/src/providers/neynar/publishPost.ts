import { EMPTY_LIST } from '@dimensiondev/constants';
import { Source } from '@dimensiondev/enums';
import { sortBy, toInteger, uniqBy } from 'lodash-es';
import { toHex } from 'viem';

import { MessageType } from '@/constants/farcaster.js';
import { MAX_IMAGE_SIZE_PER_POST, MAX_IMAGE_SIZE_PRO_PER_POST } from '@/constants/limitation.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { fixUrlProtocol } from '@/helpers/fixUrlProtocol.js';
import { isYouTubeUrl } from '@/helpers/isYouTubeUrl.js';
import { normalizeUrl } from '@/helpers/normalizeUrl.js';
import { farcasterPostIdToHash } from '@/providers/farcaster/farcasterPostIdToHash.js';
import { getAllMentionsForFarcaster } from '@/providers/farcaster/getAllMentionsForFarcaster.js';
import { publishMessage } from '@/providers/firefly/farcaster-hub/publishMessage.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import type { CastResponse } from '@/providers/types/Neynar.js';
import type { Notification, Post } from '@/providers/types/SocialMedia.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';

export async function publishPost(post: Post): Promise<{ postId: string }> {
    const result = await getAllMentionsForFarcaster(post.metadata.content?.content ?? '');

    const urls = post.metadata.content?.content?.match(URL_REGEX) || EMPTY_LIST;
    const mediaUrls = post.mediaObjects?.map((v) => ({ url: v.url })) ?? [];
    const hasRp = !!post.metadata.rpPayload;
    const contentUrls = !hasRp
        ? sortBy(urls, (x) => (isYouTubeUrl(x) ? -1 : 0)).map((url) => ({
              url: fixUrlProtocol(url),
          }))
        : EMPTY_LIST;

    // To refresh to pro status
    const state = useFarcasterProfileStore.getState();
    await state.refreshCurrentAccount();
    const imageCountLimit = state.currentProfile?.isProUser
        ? MAX_IMAGE_SIZE_PRO_PER_POST[Source.Farcaster]
        : MAX_IMAGE_SIZE_PER_POST[Source.Farcaster];

    // contentUrls might contain urls that already included in mediaUrls. see fw-5498
    const embeds = uniqBy([...mediaUrls, ...contentUrls], (x) => normalizeUrl(x.url.toLowerCase())).slice(
        0,
        imageCountLimit,
    );
    const { messageJson } = await encodeMessageData({
        type: MessageType.CAST_ADD,
        castAddBody: {
            ...result,
            embedsDeprecated: [],
            embeds,
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
