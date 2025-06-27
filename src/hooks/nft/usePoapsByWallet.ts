import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { getPoapsByWallet } from '@/services/getPoapsByWallet.js';

export function usePoapsByWallet(address: string) {
    // There is only a single page of poaps,
    // so useSuspenseInfiniteQuery To satisfy GridListInPage['queryResult']
    return useSuspenseInfiniteQuery({
        initialPageParam: '',
        getNextPageParam: () => undefined,
        queryKey: ['poap-list', address],
        queryFn: async () => {
            const poaps = await getPoapsByWallet(address);
            return { data: poaps };
        },
        select: (data) => data.pages.flatMap((x) => x.data),
    });
}
