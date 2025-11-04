'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { NFTCollection } from '@/components/CollectionDetail/NFTCollection.js';
import { notFound } from '@/esm/navigation.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function NFTCollectionPage({ chainId, address }: { chainId: number; address: string }) {
    const { data } = useSuspenseQuery({
        queryKey: ['nft-collection', chainId, address],
        async queryFn() {
            return fireflyEndpointProvider.getCollection(chainId, address);
        },
    });

    if (!data) notFound();

    return <NFTCollection collection={data} address={address} chainId={chainId} />;
}
