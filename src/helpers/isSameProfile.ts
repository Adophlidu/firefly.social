import type { FireflyIdentity, Profile as FireflyProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

type ProfileLike = Pick<Profile, 'profileId' | 'source'> | null | undefined;

export function isSameProfile(profile: ProfileLike, otherProfile: ProfileLike) {
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
