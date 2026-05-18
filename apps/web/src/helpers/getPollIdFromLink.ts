import { Source } from '@dimensiondev/enums';
import { parseUrl } from '@dimensiondev/utils';

import type { SocialSource } from '@/constants/enum.js';
import { isValidPollFrameUrl } from '@/helpers/resolveEmbedMediaType.js';
import { settings } from '@/settings/index.js';

function resolvePollIdFromMiniAppUrl(url: string) {
    if (!url.startsWith(settings.POLL_MINI_APP_URL)) return;

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
