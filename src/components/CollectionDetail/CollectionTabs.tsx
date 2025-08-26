'use client';

import { Trans } from '@lingui/react/macro';
import { Suspense, useState } from 'react';

import { NFTList } from '@/components/CollectionDetail/NFTList.js';
import { TopCollectors } from '@/components/CollectionDetail/TopCollectors.js';
import { Loading } from '@/components/Loading.js';
import { Tab, Tabs } from '@/components/Tabs/index.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface CollectionTabsProps {
    chainId?: EthereumChainId;
    address: string;
}

export function CollectionTabs({ address, chainId }: CollectionTabsProps) {
    const tabs = [
        {
            label: <Trans>Items</Trans>,
            value: 'items',
        },
        {
            label: <Trans>Top Collectors</Trans>,
            value: 'topCollectors',
        },
    ] as const;
    const [currentTab, setCurrentTab] = useState<(typeof tabs)[number]['value']>('items');

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
                        topCollectors: <TopCollectors address={address} chainId={chainId} />,
                    }[currentTab]
                }
            </Suspense>
        </div>
    );
}
