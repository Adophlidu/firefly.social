import { safeUnreachable , UnreachableError } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { logger } from '@/libs/Logger.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoint/getAllPlatformProfileFromFirefly.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { ProfileLike } from '@/providers/types/SocialMedia.js';

export function resolveFireflyProfileId(profile: ProfileLike | null) {
    if (!profile) return;

    switch (profile.source) {
        case Source.Farcaster:
            return profile.profileId;
        case Source.Lens:
            return profile.handle;
        case Source.Twitter:
            return profile.profileId;
        case Source.Bsky:
            return profile.handle;
        default:
            safeUnreachable(profile.source);
            throw new UnreachableError('source', profile.source);
    }
}

export function resolveFireflyIdentity(profile: ProfileLike | null): FireflyIdentity | null {
    if (!profile) return null;

    const profileId = resolveFireflyProfileId(profile);
    if (!profileId) return null;

    return {
        id: profileId,
        source: profile.source,
    };
}

export function resolveCurrentFireflyAccountId() {
    const profile =
        getCurrentProfileFromStorage(Source.Lens) ||
        getCurrentProfileFromStorage(Source.Farcaster) ||
        getCurrentProfileFromStorage(Source.Twitter);

    const identity = resolveFireflyIdentity(profile);
    if (!identity) return;

    return resolveFireflyAccountId(identity);
}

export async function resolveFireflyAccountId(identity: FireflyIdentity | null) {
    if (!identity) return;

    try {
        const all = await getAllPlatformProfileFromFirefly(identity, false);
        return all.fireflyAccountId;
    } catch (error) {
        logger.error('[resolveFireflyAccountId] Error fetching Firefly account ID:', error);
        return;
    }
}
