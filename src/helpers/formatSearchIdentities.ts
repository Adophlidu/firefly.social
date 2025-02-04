import { compact, first } from 'lodash-es';

import { FireflyPlatform, Source } from '@/constants/enum.js';
import { SORTED_PROFILE_SOURCES } from '@/constants/index.js';
import { resolveFireflyPlatform } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import type { Profile as FireflyProfile, SearchProfileResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

const validPlatforms = [FireflyPlatform.Farcaster, FireflyPlatform.Lens, FireflyPlatform.Twitter];

function fixProfilePlatform(profile: FireflyProfile) {
    if (!validPlatforms.includes(profile.platform)) {
        return {
            ...profile,
            platform: FireflyPlatform.Wallet,
            // we use owner as platform_id for ens
            platform_id: profile.owner || profile.platform_id,
        } as FireflyProfile;
    }

    return profile;
}

export function formatSearchIdentities(
    identities: Required<SearchProfileResponse>['data']['list'],
): Array<{ profile: FireflyProfile; related: FireflyProfile[] }> {
    return identities
        .map((x) => {
            const target = Object.values(x)
                .flat()
                .find((x) => x?.hit);
            if (!target) return;

            const allProfile = compact(
                SORTED_PROFILE_SOURCES.map((source) => {
                    const profile =
                        source === Source.Wallet
                            ? first(x.ens || x.eth || x.solana)
                            : first(x[resolveSocialSourceInUrl(source)]);
                    if (target.platform === profile?.platform) return fixProfilePlatform(target);
                    return profile ? fixProfilePlatform(profile) : null;
                }),
            );

            return {
                profile: fixProfilePlatform(target),
                related: allProfile,
            };
        })
        .filter((handle) => !!handle);
}

export function composeFireflyProfiles(
    identities: Array<{ profile: FireflyProfile; related: FireflyProfile[] }>,
    ...rest: Profile[][]
): Array<{ profile: FireflyProfile; related: FireflyProfile[] }> {
    return compact([
        ...identities,
        ...rest.flatMap((profiles) => {
            return profiles.map((x) => {
                const platform = x.source === Source.Bsky ? FireflyPlatform.Bsky : resolveFireflyPlatform(x.source);
                const existed = identities.some(
                    ({ profile }) => profile.platform === platform && profile.platform_id === x.profileId,
                );
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
