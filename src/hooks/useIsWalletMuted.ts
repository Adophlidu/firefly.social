import { useQuery } from '@tanstack/react-query';

import { FireflyPlatform } from '@/constants/enum.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { isProfileMuted } from '@/providers/firefly/endpoint/isProfileMuted.js';

export function useIsWalletMuted(address: string, enabled = true) {
    const addr = isValidAddressEthereum(address) ? address.toLowerCase() : address;
    return useQuery({
        enabled,
        queryKey: ['address-is-muted', addr],
        queryFn: () => {
            return isProfileMuted(FireflyPlatform.Wallet, addr);
        },
    });
}
