import { type UseInfiniteQueryOptions, type UseSuspenseInfiniteQueryOptions } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { type Poap } from '@/providers/types/Firefly.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPOAPsByWalletQueryOptions(address: string) {
    return {
        queryKey: ['poap-by-wallet', address.toLowerCase()],
        async queryFn() {
            return getFireflyEndpoint().getPOAPs(address);
        },
        initialPageParam: '',
        getNextPageParam: () => undefined,
        select: (data) => compact(data.pages.flatMap((x) => x || [])),
    } satisfies UseSuspenseInfiniteQueryOptions<Poap[]> | UseInfiniteQueryOptions<Poap[]>;
}
