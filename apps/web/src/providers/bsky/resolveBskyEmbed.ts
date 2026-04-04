import {
    type AppBskyEmbedExternal,
    type AppBskyEmbedImages,
    type AppBskyEmbedVideo,
    type RichText,
} from '@atproto/api';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { BskyEmbedType, FileMimeType } from '@/constants/enum.js';
import { BSKY_IMAGE_LIMITATION } from '@/constants/limitation.js';
import { base64ToFile } from '@/helpers/base64ToFile.js';
import { blobToBase64 } from '@/helpers/blobToBase64.js';
import { compressImage } from '@/helpers/compressImage.js';
import { fetchBlob } from '@/helpers/fetchBlob.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { AppBskyEmbed } from '@/providers/bsky/contentChecker.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { getPostOembed } from '@/providers/firefly/worker/getPostOembed.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export async function resolveBskyEmbed(post: Post, richText?: RichText, signal?: AbortSignal) {
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
                description: `ALT: ${gif.title || ''}`,
                uri: urlcat(gif.url, { ww: gif.width, hh: gif.height }),
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
                aspectRatio: image.width && image.height ? { width: image.width, height: image.height } : undefined,
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

    const linkFacet = richText?.facets?.find((facet) =>
        facet.features.some((feature) => AppBskyEmbed.isLinkFacet(feature)),
    );
    const linkFeature = linkFacet?.features.find((feature) => AppBskyEmbed.isLinkFacet(feature));
    const link = linkFeature?.uri && typeof linkFeature.uri === 'string' ? linkFeature.uri : undefined;
    if (link) {
        const urlData = await runInSafeAsync(() => getPostOembed(link));
        const ogImage = urlData?.og?.image?.url
            ? await fetchBlob(urlData.og.image.url)
                  .then((blob) => blobToBase64(blob))
                  .catch(() => undefined)
            : undefined;
        const compressed = ogImage
            ? await compressImage(base64ToFile(ogImage, link), {
                  ...BSKY_IMAGE_LIMITATION,
                  format: FileMimeType.JPEG,
              })
            : undefined;
        const thumbBlob = compressed?.file
            ? await bskySessionHolder.agent.uploadBlob(compressed.file, { signal })
            : undefined;

        return {
            $type: BskyEmbedType.External,
            external: {
                title: urlData?.og?.title || '',
                description: urlData?.og?.description || '',
                uri: link,
                thumb: thumbBlob?.data.blob,
            },
        } satisfies AppBskyEmbedExternal.Main;
    }

    return;
}
