import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

/**
 * Sort wallet profiles with multi-level priority:
 * 1. Primary wallet (isDefault === true)
 * 2. MPC wallets (Particle/Privy)
 * 3. Wallets with ENS names
 * 4. Alphabetical by ENS or address
 */
export function sortWalletProfiles(profiles: FireflyProfile[]): FireflyProfile[] {
    return profiles.sort((a, b) => {
        if (a.isDefault !== b.isDefault) {
            return b.isDefault ? 1 : -1;
        }

        const aOrigin = a.__origin__ as WalletProfile;
        const bOrigin = b.__origin__ as WalletProfile;
        const aIsMPC = aOrigin ? isMPCWallet(aOrigin) : false;
        const bIsMPC = bOrigin ? isMPCWallet(bOrigin) : false;
        if (aIsMPC !== bIsMPC) {
            return bIsMPC ? 1 : -1;
        }

        const aHasENS = !!aOrigin?.primary_ens;
        const bHasENS = !!bOrigin?.primary_ens;
        if (aHasENS !== bHasENS) {
            return bHasENS ? 1 : -1;
        }

        const aName = aOrigin?.primary_ens || a.identity.id;
        const bName = bOrigin?.primary_ens || b.identity.id;
        return aName.localeCompare(bName);
    });
}
