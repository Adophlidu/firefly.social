import { useQuery } from '@tanstack/react-query';

import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/endpoint/getAllPlatformProfileFromFirefly.js';
import type { FireflyIdentity, WalletProfiles } from '@/providers/types/Firefly.js';

export function useFireflyProfileByIdentity(
    identity: FireflyIdentity,
    options?: {
        initialData?: WalletProfiles;
        refetchOnMount?: boolean;
        refetchOnWindowFocus?: boolean;
    },
) {
    return useQuery({
        queryKey: ['firefly-profile', identity.source, identity.id],
        async queryFn() {
            return getAllPlatformProfileFromFirefly(identity, false);
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        ...options,
    });
}
