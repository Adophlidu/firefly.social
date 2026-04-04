import { useQuery } from '@tanstack/react-query';

import { FireflyPlatform } from '@/constants/enum.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isProfileMuted } from '@/providers/firefly/endpoint/isProfileMuted.js';

export function useIsWalletMuted(address: string, enabled = true) {
    const lowerAddress = address.toLowerCase();

    return useQuery({
        enabled,
        queryKey: ['address-is-muted', lowerAddress],
        queryFn: () => isProfileMuted(FireflyPlatform.Wallet, isValidAddressEthereum(address) ? lowerAddress : address),
    });
}
