import { MediaSource } from '@dimensiondev/enums';
import { proxyImageWorker } from '@dimensiondev/workers-client';

import { resolveMediaObjectUrl } from '@/helpers/resolveMediaObjectUrl.js';
import type { MediaObject } from '@/types/compose.js';

async function downloadUrl(url: string, name: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new File([blob], name, { type: blob.type });
}

export async function downloadUrlWithProxy(url: string, name: string) {
    const response = await proxyImageWorker['proxy-image'].$get({ query: { url } });
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
