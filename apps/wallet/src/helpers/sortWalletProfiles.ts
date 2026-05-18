import { RelatedWalletSource, WalletProfileDataSource } from '@dimensiondev/enums';

import type { WalletProfile } from '@/providers/types/Firefly.js';

export function isFireflyVerified(wallet: WalletProfile): boolean {
    return (
        wallet.verifiedSources.some((s) => s.source === RelatedWalletSource.firefly) ||
        wallet.dataSource === WalletProfileDataSource.Privy
    );
}

export function hasENS(wallet: WalletProfile): boolean {
    return !!(wallet.primary_ens || wallet.ens?.length);
}

export function isRiskWallet(wallet: WalletProfile): boolean {
    return wallet.blocked === true || wallet.hacked === true;
}

export function filterAndSortWalletProfiles(wallets: WalletProfile[]): WalletProfile[] {
    const getPriority = (w: WalletProfile) => {
        if (w.isDefault) return 0;
        if (isFireflyVerified(w)) return 1;
        if (hasENS(w)) return 2;
        if (w.is_connected) return 3;
        return 4;
    };
    return wallets.filter((w) => !isRiskWallet(w)).sort((a, b) => getPriority(a) - getPriority(b));
}
