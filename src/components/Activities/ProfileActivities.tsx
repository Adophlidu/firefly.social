'use client';

import { useAccount } from 'wagmi';

import { getProfileActivities } from '@/components/Activities/getActivities.js';
import { getActivitiesItemContent } from '@/components/Activities/getActivitiesItemContent.js';
import { ListInPage } from '@/components/ListInPage.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { ActivitiesPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { VITALIK_ADDRESS } from '@/constants/index.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

interface ProfileActivitiesProps {
    address: string;
}

export function ProfileActivities({ address }: ProfileActivitiesProps) {
    const { selectedPlatforms } = useActivitiesFilterStore(
        ActivitiesFilterNamespace.Profile,
        isSameEthereumAddress(address, VITALIK_ADDRESS) ? undefined : [ActivitiesPlatform.Limo],
    );
    const addresses = useWalletMixAddresses(address);
    const account = useAccount();

    const queryResult = useMultiInfiniteQueryPageable(
        ['activities', 'profile', address, selectedPlatforms],
        ([Source.Article, Source.DAOs] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                return getProfileActivities(source, addresses, selectedPlatforms, pageParam, account.address);
            },
        })),
        (data) => {
            return data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
        },
    );

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Activities}:${address}`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) =>
                    getActivitiesItemContent(index, item, `${ScrollListKey.Activities}:${address}`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
