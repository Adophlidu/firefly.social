import { type SocialSource, Source } from '@/constants/enum.js';
import { FARCASTER_POLL_MINI_APP_URL } from '@/constants/index.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { isValidPollFrameUrl } from '@/helpers/resolveEmbedMediaType.js';

function resolvePollIdFromMiniAppUrl(url: string) {
    if (!url.startsWith(FARCASTER_POLL_MINI_APP_URL)) return;

    const parsed = parseUrl(url);
    return parsed?.pathname.split('/')[1];
}

export function getPollIdFromLink(url: string, source: SocialSource) {
    if (source === Source.Farcaster) {
        return resolvePollIdFromMiniAppUrl(url);
    }

    if (!isValidPollFrameUrl(url)) return;

    const parsed = parseUrl(url);
    return parsed?.pathname.split('/')[2];
}
