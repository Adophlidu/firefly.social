'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { getSwapActivityItemContent } from '@/components/Swap/SwapTimeline.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { useSwapStateStore } from '@/store/useSwapStore.js';

export function WalletProfileSwapTimeline({ address }: { address: string }) {
    const isLoginFirefly = useIsLoginFirefly();
    const addresses = useWalletMixAddresses(address);
    const profileIds = useCurrentProfileIds();
    const { selectedChainId } = useSwapStateStore();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['swaps', 'profile', addresses, profileIds, selectedChainId, isLoginFirefly],
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if (!isLoginFirefly) return;
            return FireflyEndpointProvider.getSwapTimelineByAddress(
                addresses,
                selectedChainId ? [selectedChainId] : [],
                createIndicator(undefined, pageParam),
            );
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => compact(data.pages.flatMap((p) => p?.data)),
    });

    if (!isLoginFirefly) {
        return <NotLoginFallback source={Source.Swap} />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            NoResultsFallbackProps={{
                message: <Trans>No activity yet</Trans>,
            }}
            VirtualListProps={{
                listKey: `${ScrollListKey.Swap}:profile`,
                computeItemKey: (index, item) => `${item.hash}-${index}`,
                itemContent: (index, item) => getSwapActivityItemContent(index, item),
            }}
        />
    );
}
