import type { FireflyIdentity, Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import type { Profile, ProfileLike } from '@/providers/types/SocialMedia.js';

export function isSameProfile(profile: ProfileLike | null | undefined, otherProfile: ProfileLike | null | undefined) {
    if (!profile || !otherProfile) return false;
    return profile.source === otherProfile.source && profile.profileId === otherProfile.profileId;
}

export function toProfileId(profile: Profile) {
    return `${profile.source}:${profile.profileId}`;
}

export function toFireflyPlatformId(profile: FireflyProfile) {
    return `${profile.platform}:${profile.platform_id}`;
}

export function toFireflyIdentityId(identity: FireflyIdentity) {
    return `${identity.source}:${identity.id}`;
}
