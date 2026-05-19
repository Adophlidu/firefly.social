import { GIF_MEDIA_SOURCE_CONFIG } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { FileMimeType, MediaSource } from '@dimensiondev/enums';

import type { MediaObject } from '@/types/compose.js';

export function ensureGifSource(medias: MediaObject[], source: SocialSource) {
    const validGifSources = GIF_MEDIA_SOURCE_CONFIG[source];

    return medias
        .filter((x) => x.file.type === FileMimeType.GIF)
        .every((media) => {
            const mediaSources = media.urls
                ? (Object.keys(media.urls) as MediaSource[]).filter((x) => !!media.urls?.[x])
                : [];
            return mediaSources.length
                ? mediaSources.every((mediaSource) => validGifSources.includes(mediaSource))
                : validGifSources.includes(MediaSource.Local);
        });
}
