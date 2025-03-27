'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { getPolymarketActivityItemContent } from '@/components/Polymarket/PolymarketTimeLine.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function WalletProfilePolymarketList({ address }: { address: string }) {
    const isLogin = useIsLogin();
    const addresses = useWalletMixAddresses(address);
    const profileIds = useCurrentProfileIds();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket', 'profile', ...addresses, profileIds, isLogin],
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return;
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
            return FireflyEndpointProvider.getProfilePolymarketTimeline(addresses, 'all', indicator);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    if (!isLogin) {
        return <NotLoginFallback source={Source.Polymarket} />;
    }
    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Polymarket}:${address}`,
                computeItemKey: (index, item) => `${item.eventSlug}-${index}`,
                itemContent: (index, item) => getPolymarketActivityItemContent(index, item),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
