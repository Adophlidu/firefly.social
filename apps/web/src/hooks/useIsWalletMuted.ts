import { FireflyPlatform } from '@dimensiondev/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';

import { isProfileMuted } from '@/providers/firefly/endpoint/isProfileMuted.js';

export function useIsWalletMuted(address: string, enabled = true) {
    const lowerAddress = address.toLowerCase();

    return useQuery({
        enabled,
        queryKey: ['address-is-muted', lowerAddress],
        queryFn: () => isProfileMuted(FireflyPlatform.Wallet, isValidAddressEthereum(address) ? lowerAddress : address),
    });
}
