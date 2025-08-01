import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseClubUrl(url: URL) {
    if (!url.pathname.startsWith('/club')) return null;
    const [, , sourceInUrl, id, typeInUrl] = url.pathname.split('/');
    if (!sourceInUrl || !id) return null;

    const source = resolveSourceFromUrlNoFallback(sourceInUrl);
    if (!source || !isSocialSource(source)) return null;

    return { source, id, type: typeInUrl };
}
