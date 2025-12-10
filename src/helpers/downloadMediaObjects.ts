import urlcat from 'urlcat';

import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { resolveMediaObjectUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { type MediaObject, MediaSource } from '@/types/compose.js';

async function downloadUrl(url: string, name: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new File([blob], name, { type: blob.type });
}

export async function downloadUrlWithProxy(url: string, name: string) {
    const proxyUrl = urlcat(FIREFLY_WORKER_HOST, '/proxy-image', { url });
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new File([blob], name, { type: blob.type });
}

export async function downloadMediaObjects(medias: MediaObject[], useThumb = false) {
    return Promise.all(
        medias.map(async (media) => {
            const url =
                useThumb && media.thumb
                    ? media.thumb
                    : resolveMediaObjectUrl(media, [MediaSource.Giphy, MediaSource.Tenor]);
            return {
                ...media,
                file: url ? await downloadUrl(url, media.file.name) : media.file,
            };
        }),
    );
}
