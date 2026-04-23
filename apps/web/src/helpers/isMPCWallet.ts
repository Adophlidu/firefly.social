import { RelatedWalletSource, type WalletProfile, WalletProfileDataSource } from '@/providers/types/Firefly.js';

export function isMPCWallet(profile: WalletProfile) {
    return (
        profile.dataSource === WalletProfileDataSource.Particle ||
        profile.dataSource === WalletProfileDataSource.Privy ||
        profile.verifiedSources?.some((x) => x.source === RelatedWalletSource.particle)
    );
}

export function isPrivyMPCWallet(profile: WalletProfile) {
    return profile.dataSource === WalletProfileDataSource.Privy;
}
