import { envs, STATUS } from '@dimensiondev/envs';

import { RelatedWalletSource, type WalletProfile, WalletProfileDataSource } from '@/providers/types/Firefly.js';

export function isMPCWallet(profile: WalletProfile) {
    if (profile.dataSource === WalletProfileDataSource.Privy && envs.external.NEXT_PUBLIC_PRIVY === STATUS.Disabled)
        return false;
    return (
        profile.dataSource === WalletProfileDataSource.Particle ||
        profile.dataSource === WalletProfileDataSource.Privy ||
        profile.verifiedSources?.some((x) => x.source === RelatedWalletSource.particle)
    );
}
