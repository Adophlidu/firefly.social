import { GroveStorageProvider } from '@/providers/lens/Grove.js';

export function formatGroveImage(url: string) {
    if (!url?.trim()) return url;

    if (url.startsWith('lens://')) {
        return GroveStorageProvider.resolve(url);
    }

    return url;
}
