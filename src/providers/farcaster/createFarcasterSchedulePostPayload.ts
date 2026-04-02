import { sortBy, toInteger } from 'lodash-es';

import { Source, SourceInURL } from '@/constants/enum.js';
import { MAX_IMAGE_SIZE_PER_POST, MAX_IMAGE_SIZE_PRO_PER_POST } from '@/constants/limitation.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { readChars } from '@/helpers/chars.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isYouTubeUrl } from '@/helpers/isYouTubeUrl.js';
import { createS3MediaObject, resolveImageUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { farcasterPostIdToHash } from '@/providers/farcaster/farcasterPostIdToHash.js';
import { getAllMentionsForFarcaster } from '@/providers/farcaster/getAllMentionsForFarcaster.js';
import { getFarcasterMediaObjects } from '@/providers/farcaster/getFarcasterMediaObjects.js';
import { FarcasterPollProvider } from '@/providers/farcaster/Poll.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { uploadAndConvertToM3u8 } from '@/services/uploadAndConvertToM3u8.js';
import { uploadToS3 } from '@/services/uploadToS3.js';
import { type ComposeType, type CompositePost } from '@/types/compose.js';

export interface FarcasterSchedulePostPayload {
    text: string;
    mentionsPositions: number[];
    mentions: number[];
    embedsDeprecated: string[];
    embeds: Array<{ url: string } | { castId: { fid: number; hash: Uint8Array } }>;
    parentCastId?: { fid: number; hash: Uint8Array };
    parentUrl?: string;
}

export async function createFarcasterSchedulePostPayload(
    type: ComposeType,
    compositePost: CompositePost,
    isThread = false,
    signal?: AbortSignal,
): Promise<FarcasterSchedulePostPayload> {
    const { chars, parentPost, images, videos, channel, poll } = compositePost;

    const sourceName = resolveSourceName(Source.Farcaster);
    const farcasterParentPost = parentPost.Farcaster;

    // login required
    const session = getSessionFromStorage(SessionType.Farcaster);
    if (!session?.profileId) throw new Error(`Login required to post on ${sourceName}.`);

    const imageResults = await Promise.all(
        images.map(async (media) => {
            if (resolveImageUrl(Source.Farcaster, media)) return media;
            return createS3MediaObject(await uploadToS3(media.file, SourceInURL.Farcaster), media);
        }),
    );

    const videoResults = await Promise.all(
        videos.map(async (media) => {
            return createS3MediaObject(await uploadAndConvertToM3u8(media.file, SourceInURL.Farcaster, signal), media);
        }),
    );

    const pollResults = !poll
        ? []
        : [
              await FarcasterPollProvider.createPoll(
                  poll,
                  readChars({ chars, strategy: 'both', source: Source.Farcaster }),
              ),
          ];

    const currentChannel = channel[Source.Farcaster];
    const content = readChars({ chars, strategy: 'both', source: Source.Farcaster });

    const result = await getAllMentionsForFarcaster(content);

    const mediaObjects = getFarcasterMediaObjects(compositePost, {
        images: imageResults,
        videos: videoResults,
        polls: pollResults,
    }).slice(0, MAX_IMAGE_SIZE_PER_POST[Source.Farcaster]);

    const urls = content.match(URL_REGEX) || [];
    const contentUrls = sortBy(urls, (x) => (isYouTubeUrl(x) ? -1 : 0)).map((url) => ({ url }));
    const profile = getCurrentProfileFromStorage(Source.Farcaster);
    const imageCountLimit = profile?.isProUser
        ? MAX_IMAGE_SIZE_PRO_PER_POST[Source.Farcaster]
        : MAX_IMAGE_SIZE_PER_POST[Source.Farcaster];

    const embeds = [...(mediaObjects?.map((v) => ({ url: v.url })) ?? []), ...contentUrls].slice(0, imageCountLimit);
    const payload = {
        ...result,
        embedsDeprecated: [],
        embeds:
            type === 'quote' && farcasterParentPost
                ? [
                      {
                          castId: {
                              fid: toInteger(farcasterParentPost.author.profileId),
                              hash: farcasterPostIdToHash(farcasterParentPost.postId),
                          },
                      },
                      ...embeds,
                  ]
                : embeds,
        parentCastId: !isThread
            ? type === 'reply' && farcasterParentPost
                ? {
                      fid: toInteger(farcasterParentPost.author.profileId),
                      hash: farcasterPostIdToHash(farcasterParentPost.postId),
                  }
                : undefined
            : undefined,
        parentUrl:
            !(type === 'reply' && farcasterParentPost) && currentChannel?.parentUrl
                ? currentChannel.parentUrl
                : undefined,
    };

    return payload;
}
