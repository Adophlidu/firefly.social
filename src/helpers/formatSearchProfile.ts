import { compact, first } from 'lodash-es';

import { FireflyPlatform, Source } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Profile as FireflyProfile, SearchProfileResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const validPlatforms = [FireflyPlatform.Farcaster, FireflyPlatform.Lens, FireflyPlatform.Twitter, FireflyPlatform.Bsky];

function fixProfilePlatform(profile: FireflyProfile) {
    if (!validPlatforms.includes(profile.platform)) {
        return {
            ...profile,
            platform: FireflyPlatform.Wallet,
            // for ens matched
            platform_id:
                (profile.platform as unknown) === 'ens'
                    ? profile.primary_address || profile.resolved_address || profile.owner || profile.platform_id
                    : profile.resolved_address || profile.primary_address || profile.platform_id,
        } as FireflyProfile;
    }

    if (profile.platform === FireflyPlatform.Bsky) {
        return {
            ...profile,
            handle: profile.handle || profile.name,
        };
    }

    return profile;
}

export function formatFireflyProfileToProfile(profile: FireflyProfile): Profile {
    return {
        ...createDummyProfile(resolveSocialSourceFromFireflyPlatform(profile.platform)),
        profileId: profile.platform_id,
        displayName: profile.name || '',
        handle: profile.handle || '',
        fullHandle: profile.handle || '',
    };
}

interface SearchProfile {
    profile: FireflyProfile;
    related: FireflyProfile[];
    isSpecial?: boolean;
}

function isSpecialSearchProfile({ profile, related, isSpecial }: SearchProfile, keyword?: string) {
    if (isSpecial || profile.special || related.some((x) => x.special)) return true;

    if (profile.handle === keyword) return true;

    return false;
}

export function formatSearchProfile(
    identity: Required<Required<SearchProfileResponse>['data']>['list'][0],
    keyword?: string,
): SearchProfile | null {
    const target = Object.values(identity)
        .flat()
        .find((x) => x?.hit);
    if (!target) return null;

    const allProfile = compact(
        SORTED_PROFILE_SOURCES.map((source) => {
            const profiles =
                source === Source.Wallet || source === Source.WalletMix
                    ? identity.ens || identity.eth || identity.solana
                    : identity[resolveSocialSourceInUrl(source)];

            const profile = profiles?.find((x) => x.primary) || first(profiles);
            const result = target.platform === profile?.platform ? target : profile;
            return result
                ? fixProfilePlatform({
                      ...result,
                      special: profiles?.some((x) => x.special) || false,
                      related_profiles: isSocialSource(source)
                          ? identity[resolveSocialSourceInUrl(source)]?.map(fixProfilePlatform)
                          : undefined,
                  })
                : null;
        }),
    );

    return {
        profile: fixProfilePlatform(target),
        related: allProfile,
        isSpecial: isSpecialSearchProfile({ profile: target, related: allProfile }, keyword),
    };
}

function isProfileExist(identity: FireflyProfile, profile: Profile) {
    const platform = profile.source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(profile.source);

    return identity.platform === platform && identity.platform_id === profile.profileId;
}

export function composeSearchProfiles(identities: SearchProfile[], ...rest: Profile[][]): SearchProfile[] {
    const allProfiles = rest.flat();

    return compact([
        ...identities.map((identity) => {
            if (identity.profile.platform === FireflyPlatform.Twitter) {
                const matched = allProfiles.find((x) => isProfileExist(identity.profile, x));
                // our backend doesn't have twitter profile's name and avatar
                identity.profile.name = matched?.displayName || identity.profile.name;
                identity.profile.avatar = matched?.pfp || identity.profile.avatar;
            }
            return identity;
        }),
        ...rest.flatMap((profiles) => {
            return profiles.map((x, i) => {
                const platform = x.source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(x.source);
                const existed = identities.some(({ profile, related }) => {
                    return (
                        isProfileExist(profile, x) ||
                        related.some((relatedProfile) => isProfileExist(relatedProfile, x))
                    );
                });
                if (existed || !platform) return null;

                const matched = {
                    platform,
                    platform_id: x.profileId,
                    handle: x.handle,
                    name: x.displayName,
                    hit: true,
                    score: 0,
                    avatar: x.pfp,
                };
                // The first result from other apis is considered special
                return { profile: matched, related: [matched], isSpecial: i === 0 };
            });
        }),
    ]);
}

function computePriority(searchProfile: SearchProfile, keyword: string) {
    const {
        profile: { handle, name },
        isSpecial,
    } = searchProfile;

    const lowerKeyword = keyword.toLowerCase();
    const lowerHandle = handle.toLowerCase();
    const lowerName = name.toLowerCase();
    const wordReg = new RegExp(`\\b${lowerKeyword}\\b`, 'i');

    if (isSpecial) {
        return 0;
    } else if (handle === keyword) {
        return 1;
    } else if (lowerHandle === lowerKeyword) {
        return 2;
    } else if (lowerName === lowerKeyword) {
        return 3;
    } else if (wordReg.test(lowerHandle) || wordReg.test(lowerName)) {
        return 4;
    } else if (lowerHandle.includes(lowerKeyword) || lowerName.includes(lowerKeyword)) {
        return 5;
    } else {
        return Infinity; // lowest priority
    }
}

export function sortSearchProfiles(data: SearchProfile[], keyword: string) {
    if (!keyword) return data;

    return data
        .map((item) => ({ data: item, priority: computePriority(item, keyword) }))
        .sort((a, b) => a.priority - b.priority)
        .map((item) => item.data);
}
