import { LENS_MEDIA_SNAPSHOT_URL } from '@/constants/static.js';
import { formatGroveImage } from '@/helpers/formatGroveImage.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';

export function formatImageUrl(url: string, name?: string) {
    if (!url) return '';

    if (url.startsWith(LENS_MEDIA_SNAPSHOT_URL)) {
        const splitedUrl = url.split('/');
        const path = splitedUrl[splitedUrl.length - 1];
        return name ? `${LENS_MEDIA_SNAPSHOT_URL}/${name}/${path}` : url;
    }

    return url;
}

export function formatLensImageUrl(url: string, resize = false) {
    if (!url?.trim()) return url;

    return sanitizeDStorageUrl(formatGroveImage(url), undefined, resize);
}
