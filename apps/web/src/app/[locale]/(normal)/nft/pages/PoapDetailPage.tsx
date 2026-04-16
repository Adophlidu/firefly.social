'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { gnosis } from 'viem/chains';

import { Loading } from '@/components/Loading.js';
import { Attendees } from '@/components/NFTDetail/Attendees.js';
import { NFTInfo } from '@/components/NFTDetail/NFTInfo.js';
import { NFTOverflow } from '@/components/NFTDetail/NFTOverflow.js';
import { NFTNavbar } from '@/components/NFTs/NFTNavbar.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { notFound } from '@/esm/navigation.js';
import { getPOAP } from '@/providers/firefly/nft/getPOAP.js';
import type { NonFungibleTokenTrait } from '@/web3-shared/base/specs.js';
import { EthereumSchemaType } from '@/web3-shared/evm/types.js';

export function PoapDetailPage({ tokenId }: { tokenId: string }) {
    const { data: poap, isLoading } = useQuery({
        queryKey: ['post-event', tokenId],
        async queryFn() {
            return getPOAP(tokenId);
        },
    });
    const traits: NonFungibleTokenTrait[] = useMemo(() => {
        if (!poap) return EMPTY_LIST;
        return [
            {
                type: 'Created by',
                value: poap?.owner,
            },
            {
                type: 'Attendance',
                value: poap.supply.order.toString(),
            },
        ];
    }, [poap]);
    if (isLoading) {
        return <Loading />;
    }

    if (!poap) {
        notFound();
    }
    const poapAttendeesCount = poap?.supply.order;

    return (
        <div className="min-h-screen">
            <NFTNavbar>{poap.event.name}</NFTNavbar>
            <div className="space-y-4 px-4 py-3">
                <NFTInfo
                    imageURL={poap.event.image_url}
                    name={poap.event.name}
                    tokenId={poap.tokenId}
                    ownerAddress={poap.owner}
                    contractAddress={POAP_CONTRACT_ADDRESS}
                    disableBookmark
                    disableReport
                    collection={{
                        name: poap.event.name,
                        icon: poap.event.image_url,
                    }}
                    isPoap
                    chainId={gnosis.id}
                    attendance={poapAttendeesCount}
                    externalUrl={poap.event.event_url}
                    traits={traits}
                />
                <NFTOverflow
                    description={poap.event.description ?? ''}
                    tokenId={tokenId}
                    contractAddress={POAP_CONTRACT_ADDRESS}
                    chainId={gnosis.id}
                    schemaType={EthereumSchemaType.ERC721}
                />
                {poap.event.id ? <Attendees eventId={poap.event.id} /> : null}
            </div>
        </div>
    );
}
