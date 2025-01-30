import type { AppBskyEmbedExternal, AppBskyEmbedImages, AppBskyEmbedVideo } from '@atproto/api';
import { first } from 'lodash-es';

import { BskyEmbedType, FileMimeType } from '@/constants/enum.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveBskyEmbed(post: Post) {
    const images = post.mediaObjects?.filter((media) => media.type === 'Image' && !!media.blobRef);
    const gifs = post.mediaObjects?.filter(
        (media) => media.type === 'Image' && media.mimeType === FileMimeType.GIF && !!media.blobRef,
    );
    const videos = post.mediaObjects?.filter((media) => media.type === 'Video' && !!media.blobRef);

    const gif = first(gifs);
    if (gif) {
        return {
            $type: BskyEmbedType.External,
            external: {
                title: gif.title || '',
                description: gif.title || '',
                uri: gif.url,
                thumb: gif.blobRef,
            },
        } satisfies AppBskyEmbedExternal.Main;
    }

    if (images?.length) {
        return {
            $type: BskyEmbedType.Images,
            images: images.map((image) => ({
                image: image.blobRef!,
                alt: image.title || '',
            })),
        } satisfies AppBskyEmbedImages.Main;
    }

    const video = first(videos);
    if (video) {
        return {
            $type: BskyEmbedType.Video,
            video: video.blobRef!,
            aspectRatio: video.width && video.height ? { width: video.width, height: video.height } : undefined,
        } satisfies AppBskyEmbedVideo.Main;
    }

    return undefined;
}
