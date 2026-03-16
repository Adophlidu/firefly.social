import { compact } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { formatAddressEthereum, formatAddressSolana } from '@/helpers/formatAddress.js';
import {
    RelatedWalletSource,
    type WalletProfile,
    WalletProfileDataSource,
    type WalletProfiles,
} from '@/providers/types/Firefly.js';

function patchWalletProfile(profile: WalletProfile) {
    profile.verifiedSources.forEach((source) => {
        if ((source.source as string) === 'Firefly') {
            source.source = RelatedWalletSource.firefly;
        }
    });
    return profile;
}

export function formatFireflyProfilesFromWalletProfiles(
    profiles: WalletProfiles,
    options?: {
        ignoreParticle?: boolean;
    },
) {
    const fireflyProfiles = compact(
        [
            ...profiles.walletProfiles.map((x) => ({
                identity: {
                    id: x.address,
                    source: Source.Wallet,
                },
                handle: x.address,
                displayName: x.primary_ens || formatAddressEthereum(x.address, 4),
                isDefault: x.isDefault,
                __origin__: patchWalletProfile(x),
            })),
            ...profiles.solanaWalletProfiles.map((x) => ({
                identity: {
                    id: x.address,
                    source: Source.Wallet,
                },
                handle: x.address,
                displayName: x.primary_ens || formatAddressSolana(x.address, 4),
                isDefault: x.isDefault,
                __origin__: patchWalletProfile(x),
            })),
            ...profiles.farcasterProfiles.map((x) => ({
                identity: {
                    id: `${x.fid}`,
                    source: Source.Farcaster,
                },
                handle: x.username,
                displayName: x.username,
                __origin__: x,
                isDefault: x.isDefault,
            })),
            ...profiles.lensProfilesV3.map((x) => ({
                identity: {
                    id: x.localName,
                    source: Source.Lens,
                },
                handle: x.fullHandle,
                displayName: x.localName,
                isDefault: x.isDefault,
                __origin__: x,
            })),
            ...profiles.twitterProfiles.map((x) => ({
                identity: {
                    id: x.twitter_id,
                    source: Source.Twitter,
                },
                handle: x.handle,
                displayName: x.handle,
                isDefault: x.isDefault,
                __origin__: x,
            })),
            ...(profiles.bskyProfiles?.map((x) => {
                const prefix = 'bsky_';
                const identityId = x.handle?.startsWith(prefix) ? x.handle.substring(prefix.length) : x.handle;
                return {
                    identity: {
                        id: identityId ?? '',
                        source: Source.Bsky,
                    },
                    handle: x.handle ?? '',
                    isDefault: x.isDefault,
                    displayName: x.handle ?? '',
                    __origin__: x,
                };
            }) ?? []),
        ].filter((x) => x.identity.id),
    );
    if (options?.ignoreParticle) {
        return fireflyProfiles.filter(
            (profile) =>
                profile.identity.source !== Source.Wallet ||
                (profile.__origin__ as WalletProfile | null)?.dataSource !== WalletProfileDataSource.Particle,
        );
    }

    return fireflyProfiles;
}
