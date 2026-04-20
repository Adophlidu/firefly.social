import { NetworkType } from '@dimensiondev/web3/enums';
import { isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { isObject } from 'lodash-es';
import type { Address } from 'viem';

import { type ProfilePageSource, Source } from '@/constants/enum.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoint/getAllPlatformProfileFromFirefly.js';
import type { WalletProfile, WalletProfiles } from '@/providers/types/Firefly.js';

function isEmpty(profiles: WalletProfiles) {
    if (!profiles || !isObject(profiles)) return true;

    return Object.keys(profiles).every((key) => {
        const platformProfiles = profiles[key as keyof WalletProfiles];

        return !platformProfiles || (Array.isArray(platformProfiles) && platformProfiles.length === 0);
    });
}

export async function getAllRelatedProfilesWithDefault(identity: { source: ProfilePageSource; id: string }) {
    const result = await getAllPlatformProfileFromFirefly(identity, false, true);

    const networkType = isValidAddressEthereum(identity.id)
        ? NetworkType.Ethereum
        : isValidAddressSolana(identity.id)
          ? NetworkType.Solana
          : undefined;

    if ([Source.Wallet, Source.WalletMix].includes(identity.source) && isEmpty(result) && networkType) {
        const defaultProfile: WalletProfile = {
            address: identity.id as Address,
            blockchain: networkType,
            is_connected: false,
            verifiedSources: [],
        };
        return {
            ...result,
            [networkType === NetworkType.Ethereum ? 'walletProfiles' : 'solanaWalletProfiles']: [defaultProfile],
        };
    }

    return result;
}
