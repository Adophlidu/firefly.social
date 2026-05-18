import { Source } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import { getAllPlatformProfileByIdentity } from '@/providers/firefly/endpoint/getAllPlatformProfileByIdentity.js';

/**
 * get wallet related Firefly profiles
 */
export function useWalletRelatedProfiles(address: string, enabled = true) {
    return useQuery({
        enabled,
        queryKey: ['wallet-related-profiles', address.toLowerCase()],
        queryFn: async () => {
            return getAllPlatformProfileByIdentity({ id: address, source: Source.Wallet }, false);
        },
        select: (list) => {
            const profiles = uniqBy(list, (x) => `${x.identity.source}_${x.identity.id}`);
            return profiles;
        },
    });
}
