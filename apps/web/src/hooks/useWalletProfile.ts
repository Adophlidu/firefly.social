import { Source } from '@dimensiondev/enums';
import { isSameAddress } from '@dimensiondev/web3/utils';

import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export function useWalletProfile(address: string, enabled = true) {
    const query = useWalletRelatedProfiles(address, enabled);

    const walletProfile = query.data?.find(
        (x) => x.identity.source === Source.Wallet && isSameAddress(x.identity.id, address),
    )?.__origin__ as WalletProfile | undefined;

    return {
        ...query,
        data: walletProfile,
    };
}
