import { use } from 'react';

import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { Source } from '@/constants/enum.js';

export function useWalletMixAddresses(address: string) {
    const { profiles, identity } = use(ProfileContext);
    return identity?.source === Source.WalletMix
        ? profiles.filter((profile) => profile.identity.source === Source.Wallet).map((profile) => profile.identity.id)
        : [address];
}
