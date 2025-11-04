'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { HTMLProps } from 'react';

import { TrendingNFT } from '@/components/explore/TrendingNFT.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { VirtualListFooterBottomText } from '@/components/VirtualList/VirtualListFooterBottomText.js';
import { fireflyNftProvider } from '@/providers/firefly/Nft.js';

export function TrendingNFTs(props: HTMLProps<HTMLDivElement>) {
    const { data, isFetching } = useSuspenseQuery({
        queryKey: ['explore-nfts'],
        queryFn: async () => {
            const nfts = await fireflyNftProvider.getTrendingNFTs(100);
            return nfts.filter((x) => x.contract_name);
        },
    });

    if (!data.length && !isFetching) {
        return <NoResultsFallback />;
    }

    return (
        <div {...props}>
            {data.map((x) => (
                <TrendingNFT key={`${x.chain_id}:${x.contract_address}`} collection={x} />
            ))}
            <VirtualListFooterBottomText />
        </div>
    );
}
