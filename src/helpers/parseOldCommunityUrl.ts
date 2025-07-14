import type { ChannelTabType, SocialSource } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseOldCommunityUrl(url: URL): { source: SocialSource; type: ChannelTabType; id: string } | null {
    if (!url.pathname.startsWith('/community')) return null;
    const [, , sourceInUrl, id, typeInUrl] = url.pathname.split('/');
    if (!sourceInUrl || !id || !typeInUrl) return null;

    const source = resolveSourceFromUrlNoFallback(sourceInUrl);
    if (!source || !isSocialSource(source)) return null;

    return { source, id, type: typeInUrl as ChannelTabType };
}
