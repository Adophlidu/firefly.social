import { safeUnreachable, UnreachableError } from '@dimensiondev/utils';

import { type ProfileSource, type SocialSource, Source } from '@/constants/enum.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function createDummyProfile(source: SocialSource, profileSource: ProfileSource = source) {
    return {
        source,
        profileSource,
        profileId: '',
        handle: '',
        pfp: '',
        displayName: '',
        followerCount: 0,
        followingCount: 0,
        fullHandle: '',
        status: ProfileStatus.Active,
        verified: true,
        isProUser: false,
    } satisfies Profile;
}

export function createDummyProfileFromFireflySession(fireflySession: FireflySession) {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: fireflySession.profileId,
        profileSource: Source.Firefly,
        displayName: fireflySession.payload?.displayName ?? 'Firefly',
        pfp: fireflySession.payload?.avatar ?? '',
        handle: fireflySession.payload?.uid ?? '',
    } satisfies Profile;
}

export function createDummyProfileFromThirdPartySession(
    forSource: Source.Telegram | Source.Email,
    session: ThirdPartySession,
) {
    switch (forSource) {
        case Source.Telegram:
            return createDummyProfile(Source.Farcaster, Source.Telegram);
        case Source.Email:
            if (!session.payload?.accountId || !session.payload?.email) {
                throw new Error('Invalid email session');
            }

            return {
                ...createDummyProfile(Source.Farcaster, Source.Email),
                profileId: session.payload.accountId,
                displayName: session.payload.displayName ?? session.payload.email,
                handle: session.payload.email,
                fullHandle: session.payload.email,
                pfp: session.payload.avatar ?? '',
            } satisfies Profile;
        default:
            safeUnreachable(forSource);
            throw new UnreachableError('forSource', forSource);
    }
}
