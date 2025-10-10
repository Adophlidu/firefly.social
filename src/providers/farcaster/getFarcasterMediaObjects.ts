import { uniqBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { isFrameV1 } from '@/helpers/frame.js';
import { getFarcasterPollUrl } from '@/helpers/getPollFrameUrl.js';
import { resolveImageUrl, resolveVideoUrl } from '@/helpers/resolveMediaObjectUrl.js';
import type { Poll } from '@/providers/types/Poll.js';
import type { CompositePost } from '@/store/useComposeStore.js';
import { type MediaObject } from '@/types/compose.js';

export function getFarcasterMediaObjects(
    compositePost: CompositePost,
    {
        images,
        videos,
        polls,
    }: {
        images: MediaObject[];
        videos: MediaObject[];
        polls: Poll[];
    },
) {
    const { frames, openGraphs, urls } = compositePost;

    return uniqBy(
        [
            ...images.map((media) => ({
                url: resolveImageUrl(Source.Farcaster, media),
                mimeType: media.mimeType,
            })),
            ...frames.filter(isFrameV1).map((frame) => ({ title: frame.title, url: frame.url })),
            ...openGraphs.map((openGraph) => ({ title: openGraph.title!, url: openGraph.url })),
            ...(polls ?? []).map((poll) => ({
                url: getFarcasterPollUrl(poll.id),
            })),
            ...videos.map((media) => ({
                url: resolveVideoUrl(Source.Farcaster, media),
                mimeType: media.mimeType,
            })),
            ...urls.map((url) => ({
                url,
            })),
        ],
        (x) => x.url.toLowerCase(),
    );
}
