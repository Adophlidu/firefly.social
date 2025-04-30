import { compact, first } from 'lodash-es';

import { FireflyPlatform, Source } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
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

interface SearchProfile {
    profile: FireflyProfile;
    related: FireflyProfile[];
}

export function formatSearchProfile(
    identity: Required<SearchProfileResponse>['data']['list'][0],
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
            if (target.platform === profile?.platform) return fixProfilePlatform(target);
            return profile ? fixProfilePlatform(profile) : null;
        }),
    );

    return {
        profile: fixProfilePlatform(target),
        related: allProfile,
    };
}

function isProfileExist(identity: FireflyProfile, profile: Profile) {
    const platform = profile.source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(profile.source);

    return identity.platform === platform && identity.platform_id === profile.profileId;
}

export function composeSearchProfiles(identities: SearchProfile[], ...rest: Profile[][]): SearchProfile[] {
    return compact([
        ...identities,
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
