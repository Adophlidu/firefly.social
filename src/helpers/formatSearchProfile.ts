import { compact, first } from 'lodash-es';

import { FireflyPlatform, Source } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { isValidAddress } from '@/helpers/isValidAddress.js';
import { isZeroAddress } from '@/helpers/isZeroAddress.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Profile as FireflyProfile, SearchProfileResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const validPlatforms = [
    FireflyPlatform.Farcaster,
    FireflyPlatform.Lens,
    FireflyPlatform.Twitter,
    FireflyPlatform.Bsky,
    FireflyPlatform.Firefly,
];

function fixProfilePlatform(profile: FireflyProfile) {
    if (!validPlatforms.includes(profile.platform)) {
        return {
            ...profile,
            platform: FireflyPlatform.Wallet,
            // for ens matched
            platform_id:
                (profile.platform as unknown) === 'ens'
                    ? profile.resolved_address || profile.registrant || profile.owner || profile.wrapped_owner
                    : profile.platform_id,
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

export interface SearchProfile {
    account?: FireflyProfile;
    profile: FireflyProfile;
    related: FireflyProfile[];
    isSpecial?: boolean;
    addresses?: Array<{ address: string; ens?: string }>;
}

function isSpecialSearchProfile({ profile, related, isSpecial }: SearchProfile, keyword?: string) {
    if (isSpecial || profile.special || related.some((x) => x.special)) return true;

    if (profile.handle === keyword) return true;

    return false;
}

function getMatchedProfile(
    identity: Required<Required<SearchProfileResponse>['data']>['list'][0],
): FireflyProfile | null {
    const socialMatched = [
        identity.farcaster,
        identity.lens,
        identity.twitter,
        identity.bsky,
        identity.ens,
        identity.eth,
        identity.solana,
    ]
        .flat()
        .find((x) => x?.hit);

    if (socialMatched) return socialMatched;

    const accountMatched = identity.account?.find((x) => x?.hit) || null;
    if (!accountMatched) return null;

    return {
        ...accountMatched,
        platform: FireflyPlatform.Firefly,
    };
}

export function formatSearchProfile(
    identity: Required<Required<SearchProfileResponse>['data']>['list'][0],
    keyword?: string,
): SearchProfile | null {
    const target = getMatchedProfile(identity);
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

    const stringAddresses = [
        ...compact(identity.eth?.map((x) => x.primary_address || x.platform_id)),
        ...compact(identity.solana?.map((x) => x.primary_address || x.platform_id)),
    ];
    const ens =
        identity.ens
            ?.map((x) => {
                return {
                    ens: x.name,
                    address: x.resolved_address!,
                };
            })
            .filter((x) => !isZeroAddress(x.address) && isValidAddress(x.address)) ?? [];

    if (target.platform === FireflyPlatform.Firefly && !allProfile.length) return null;

    return {
        account: identity.account?.[0],
        profile: fixProfilePlatform(target),
        related: allProfile,
        isSpecial: isSpecialSearchProfile({ profile: target, related: allProfile }, keyword),
        addresses: [
            ...stringAddresses.map((address) => ({
                address,
            })),
            ...ens,
        ],
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
