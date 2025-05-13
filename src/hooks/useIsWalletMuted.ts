import { useQuery } from '@tanstack/react-query';

import { FireflyPlatform } from '@/constants/enum.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useIsWalletMuted(address: string, enabled = true) {
    const addr = isValidAddressEthereum(address) ? address.toLowerCase() : address;
    return useQuery({
        enabled,
        queryKey: ['address-is-muted', addr],
        queryFn: () => {
            return FireflyEndpointProvider.isProfileMuted(FireflyPlatform.Wallet, addr);
        },
    });
}
