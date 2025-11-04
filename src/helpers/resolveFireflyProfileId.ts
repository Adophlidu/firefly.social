import { safeUnreachable } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoints/getAllPlatformProfileFromFirefly.js';
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
        getProfileFromStorage(Source.Lens) ||
        getProfileFromStorage(Source.Farcaster) ||
        getProfileFromStorage(Source.Twitter);

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
        console.error('[resolveFireflyAccountId] Error fetching Firefly account ID:', error);
        return;
    }
}
