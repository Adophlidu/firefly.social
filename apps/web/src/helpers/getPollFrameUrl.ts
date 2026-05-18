import type { SocialSource } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export function getPollFrameUrl(pollId: string, source?: SocialSource, author?: Profile) {
    const profile = author ? author : source ? getCurrentProfileFromStorage(source) : null;
    return urlcat(settings.FRAME_SERVER_URL, `/polls/${pollId}`, {
        author: profile ? getProfileUrl(profile) : null,
        handle: profile?.handle,
        source: source?.toLowerCase(),
    });
}

export function getFarcasterPollUrl(pollId: string, authorHandle?: string) {
    return urlcat(settings.POLL_MINI_APP_URL, '/:pollId', { pollId, author: authorHandle });
}
