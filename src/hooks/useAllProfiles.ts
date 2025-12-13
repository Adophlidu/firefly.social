import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/static.js';
import { getAllPlatformProfileByIdentity } from '@/providers/firefly/endpoint/getAllPlatformProfileByIdentity.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

export function useAllProfiles(identity?: FireflyIdentity) {
    return useQuery({
        queryKey: ['all-profiles', identity?.source, identity?.id],
        async queryFn() {
            if (!identity) return EMPTY_LIST;
            return getAllPlatformProfileByIdentity(identity, false);
        },
        staleTime: 1000 * 60 * 5,
        enabled: !!identity,
    });
}
