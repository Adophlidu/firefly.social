import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { getPoapsByWallet } from '@/services/getPoapsByWallet.js';

export function usePoapsByWallet(address: string) {
    // There is only a single page of poaps,
    // so useSuspenseInfiniteQuery To satisfy GridListInPage['queryResult']
    return useSuspenseInfiniteQuery({
        initialPageParam: '',
        getNextPageParam: () => undefined,
        queryKey: ['poap-list', address],
        queryFn: async () => {
            try {
                const poaps = await getPoapsByWallet(address);
                return { data: poaps };
            } catch {
                return;
            }
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data || [])),
    });
}
