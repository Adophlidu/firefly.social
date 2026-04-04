'use client';

import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { NFTImage } from '@/components/NFTImage.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';

interface NFTCollectionProps {
    contractAddress: string;
    chainId: number;
    sourceLink: string;
}

export const NFTCollection = memo<NFTCollectionProps>(function NFTCard({ contractAddress, chainId, sourceLink }) {
    const { data: collection, isLoading } = useNFTCollection(contractAddress, chainId);

    if (isLoading) {
        return <Loading />;
    }

    if (!collection) return null;

    return (
        <Link
            className="my-5 flex w-full items-center justify-center"
            href={sourceLink}
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className="bg-bg max-w-[250px] rounded-lg">
                <NFTImage
                    src={collection.banner_url}
                    width={120}
                    height={120}
                    className="aspect-square size-full rounded-xl object-cover sm:mb-0 sm:w-auto"
                    draggable={false}
                    alt={collection.name || contractAddress || ''}
                />
                <div className="p-2">
                    <div className="text-main mb-2 text-base font-bold">{collection.name}</div>
                </div>
            </div>
        </Link>
    );
});
