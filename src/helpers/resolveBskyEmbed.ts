import type { AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { first } from 'lodash-es';

import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveBskyEmbed(post: Post) {
    const images = post.mediaObjects?.filter((media) => media.type === 'Image' && !!media.blobRef);
    const videos = post.mediaObjects?.filter((media) => media.type === 'Video' && !!media.blobRef);

    if (images?.length) {
        return {
            $type: 'app.bsky.embed.images',
            images: images.map((image) => ({
                image: image.blobRef!,
                alt: image.title || '',
            })),
        } satisfies AppBskyEmbedImages.Main;
    }

    const video = first(videos);
    if (video) {
        return {
            $type: 'app.bsky.embed.video',
            video: video.blobRef!,
            aspectRatio: video.width && video.height ? { width: video.width, height: video.height } : undefined,
        } satisfies AppBskyEmbedVideo.Main;
    }

    return undefined;
}
