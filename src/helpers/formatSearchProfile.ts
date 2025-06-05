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
                    ? profile.owner || profile.primary_address || profile.resolved_address || profile.platform_id
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

export function formatSearchProfile(
    identity: Required<Required<SearchProfileResponse>['data']>['list'][0],
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
        isSpecial: target.special,
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
                identity.profile.name = matched?.displayName || identity.profile.name;
            }
            return identity;
        }),
        ...rest.flatMap((profiles) => {
            return profiles.map((x) => {
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
                return { profile: matched, related: [matched] };
            });
        }),
    ]);
}

function isEqualString(a: string, b: string) {
    return a.toLowerCase() === b.toLowerCase();
}

export function sortSearchProfiles(data: SearchProfile[], keyword: string) {
    const specials: SearchProfile[] = [];
    const handleMatched: SearchProfile[] = [];
    const nameMatched: SearchProfile[] = [];
    const others: SearchProfile[] = [];

    data.forEach((item) => {
        if (item.isSpecial) {
            specials.push(item);
        } else if (isEqualString(item.profile.handle, keyword)) {
            handleMatched.push(item);
        } else if (isEqualString(item.profile.name, keyword)) {
            nameMatched.push(item);
        } else {
            others.push(item);
        }
    });

    return [
        ...specials,
        ...handleMatched,
        ...nameMatched,
        ...others.sort((a, b) => {
            const aHandle = a.profile.handle.toLowerCase();
            const bHandle = b.profile.handle.toLowerCase();
            return aHandle.localeCompare(bHandle);
        }),
    ];
}
