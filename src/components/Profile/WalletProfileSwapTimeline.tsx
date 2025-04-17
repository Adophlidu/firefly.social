'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { getSwapActivityItemContent } from '@/components/Swap/SwapTimeline.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function WalletProfileSwapTimeline({ address }: { address: string }) {
    const isLoginFirefly = useIsLoginFirefly();
    const addresses = useWalletMixAddresses(address);
    const profileIds = useCurrentProfileIds();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['swaps', 'profile', addresses, profileIds, isLoginFirefly],
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if (!isLoginFirefly) return;
            return FireflyEndpointProvider.getSwapTimelineByAddress(
                addresses,
                EMPTY_LIST,
                createIndicator(undefined, pageParam),
            );
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    if (!isLoginFirefly) {
        return <NotLoginFallback source={Source.Swap} className="md:!pt-0" />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Swap}:profile`,
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: (index, item) => getSwapActivityItemContent(index, item),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
