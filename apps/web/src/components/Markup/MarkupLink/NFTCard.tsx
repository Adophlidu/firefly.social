'use client';

import { ETH_ZERO_ADDRESS } from '@dimensiondev/web3-utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { NFTImage } from '@/components/NFTImage.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';

interface NFTCardProps {
    chainId: number;
    contractAddress: string;
    tokenId: string;
    sourceLink: string;
}

export const NFTCard = memo<NFTCardProps>(function NFTCard({ chainId, contractAddress, tokenId, sourceLink }) {
    const { data: nft, isLoading } = useNFTDetail(chainId, contractAddress ?? ETH_ZERO_ADDRESS, tokenId);

    if (isLoading) {
        return <Loading />;
    }

    if (!nft) return null;

    return (
        <Link
            className="my-5 flex w-full items-center justify-center"
            href={sourceLink}
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className="bg-bg max-w-[250px] rounded-lg">
                <NFTImage
                    src={nft.nftscan_uri || nft.imageURL || nft.image_uri || ''}
                    width={120}
                    height={120}
                    className="aspect-square size-full rounded-xl object-cover sm:mb-0 sm:w-auto"
                    draggable={false}
                    alt={contractAddress ?? ''}
                />
                <div className="p-2">
                    <div className="text-main mb-2 text-base font-bold">{nft.name}</div>
                    <div className="flex items-center">
                        <div className="bg-primaryBottom rounded-lg p-2 text-xs">{nft.contract_name}</div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
