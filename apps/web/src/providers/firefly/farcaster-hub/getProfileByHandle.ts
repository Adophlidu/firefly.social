import { NotFoundError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { formatFireflyFarcasterProfile } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FireflyFarcasterProfileResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getProfileByHandle(handle: string): Promise<Profile> {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/user/profile', {
            handle,
            sourceFid: session?.profileId,
        });
        const response = await fireflySessionHolder.fetch<FireflyFarcasterProfileResponse>(url);
        if (!response.data) throw new NotFoundError(`The farcaster profile not found with handle: ${handle}.`);
        return formatFireflyFarcasterProfile(response.data);
    });
}
