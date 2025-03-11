import { type SocialSource, Source } from '@/constants/enum.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function createDummyProfile(source: SocialSource) {
    return {
        source,
        profileId: '',
        profileSource: Source.Farcaster,
        handle: '',
        pfp: '',
        displayName: '',
        followerCount: 0,
        followingCount: 0,
        fullHandle: '',
        status: ProfileStatus.Active,
        verified: true,
    } satisfies Profile;
}

export function createDummyProfileFromFireflyAccountId(accountId: string) {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: accountId,
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

export function createDummyProfileFromLensHandle(handle: string) {
    return {
        ...createDummyProfile(Source.Lens),
        handle,
    };
}
