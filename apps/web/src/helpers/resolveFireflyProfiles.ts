import { Source } from '@dimensiondev/enums';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import type { SocialSource } from '@/constants/enum.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

export function resolveFireflyProfiles(
    profileIdentity: FireflyIdentity,
    profiles: FireflyProfile[],
): { socialProfile: FireflyProfile | null; walletProfile: WalletProfile | null } {
    if (!profileIdentity.id)
        return {
            socialProfile: null,
            walletProfile: null,
        };
    return {
        socialProfile:
            profiles.find(
                (x) =>
                    SORTED_SOCIAL_SOURCES.includes(x.identity.source as SocialSource) &&
                    isSameFireflyIdentity(x.identity, profileIdentity),
            ) ?? null,
        walletProfile:
            (profiles.find(
                (x) => x.identity.source === Source.Wallet && isSameFireflyIdentity(x.identity, profileIdentity),
            )?.__origin__ as WalletProfile | undefined) ?? null,
    };
}
