import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

/**
 * get wallet related Firefly profiles
 */
export function useWalletRelatedProfiles(address: string) {
    return useQuery({
        queryKey: ['wallet-related-profiles', address],
        queryFn: async () => {
            return FireflyEndpointProvider.getAllPlatformProfileByIdentity(
                { id: address, source: Source.Wallet },
                false,
            );
        },
        select: (list) => {
            const profiles = uniqBy(list, (x) => `${x.identity.source}_${x.identity.id}`);
            return profiles;
        },
    });
}
