import { safeUnreachable } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';
import { first } from 'lodash-es';

import type { WalletProfile } from '@/providers/types/Firefly.js';

/**
 * Get the ENS name from a wallet profile. The priority is as follows:
 * 1. Ethereum:
 *    - primary_ens field
 *    - baseEth entries with is_primary flag
 *    - first entry in ens array
 *    - first entry in baseEth array
 * 2. Solana:
 *    - sns entries with is_primary flag
 *    - seekerId entries with is_primary flag
 *    - first entry in sns array
 *    - first entry in seekerId array
 * @Reference https://mask.atlassian.net/browse/MX-17416
 * @param profile - The wallet profile to extract the ENS name from.
 * @returns The ENS name if found, otherwise undefined.
 */
export function getEnsNameFromWalletProfile(profile: WalletProfile) {
    switch (profile.blockchain) {
        case NetworkType.Ethereum: {
            if (profile.primary_ens) return profile.primary_ens;

            const primaryBaseEns = profile.baseEth?.find((ens) => ens.is_primary)?.handle;
            if (primaryBaseEns) return primaryBaseEns;

            const ethEns = first(profile.ens);
            if (ethEns) return ethEns;

            return first(profile.baseEth)?.handle;
        }
        case NetworkType.Solana: {
            const primarySns = profile.sns?.find((sns) => sns.is_primary)?.handle;
            if (primarySns) return primarySns;

            const primarySkr = profile.seekerId?.find((skr) => skr.is_primary)?.handle;
            if (primarySkr) return primarySkr;

            return first(profile.sns)?.handle || first(profile.seekerId)?.handle;
        }
        default:
            safeUnreachable(profile.blockchain);
            return;
    }
}
