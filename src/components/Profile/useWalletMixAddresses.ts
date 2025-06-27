import { use, useMemo } from 'react';

import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { Source } from '@/constants/enum.js';

export function useWalletMixAddresses(address: string) {
    const { profiles, identity } = use(ProfileContext);
    return useMemo(() => {
        return identity?.source === Source.WalletMix
            ? profiles
                  .filter((profile) => profile.identity.source === Source.Wallet)
                  .map((profile) => profile.identity.id)
            : [address];
    }, [address, identity?.source, profiles]);
}
