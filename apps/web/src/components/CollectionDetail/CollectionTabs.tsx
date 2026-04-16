'use client';

import { Trans } from '@lingui/react/macro';
import { useQueryState } from 'nuqs';
import { Suspense } from 'react';

import { NFTList } from '@/components/CollectionDetail/NFTList.js';
import { TopCollectors } from '@/components/CollectionDetail/TopCollectors.js';
import { Loading } from '@/components/Loading.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';

interface CollectionTabsProps {
    chainId?: number;
    address: string;
}

export function CollectionTabs({ address, chainId }: CollectionTabsProps) {
    const tabs = [
        {
            label: <Trans id="nft-items">Items</Trans>,
            value: 'items',
        },
        {
            label: <Trans>Top Collectors</Trans>,
            value: 'collectors',
        },
    ] as const;
    const [currentTab, setCurrentTab] = useQueryState('tab', { defaultValue: 'items' });

    return (
        <div className="px-3 pb-3">
            <Tabs value={currentTab} onChange={setCurrentTab} variant="second">
                {tabs.map((tab) => (
                    <Tab value={tab.value} key={tab.value}>
                        {tab.label}
                    </Tab>
                ))}
            </Tabs>
            <Suspense fallback={<Loading />}>
                {
                    {
                        items: (
                            <NFTList
                                address={address}
                                chainId={chainId}
                                NoResultsFallbackProps={{
                                    className: 'md:pt-[228px] max-md:py-20',
                                }}
                            />
                        ),
                        collectors: <TopCollectors address={address} chainId={chainId} />,
                    }[currentTab]
                }
            </Suspense>
        </div>
    );
}
