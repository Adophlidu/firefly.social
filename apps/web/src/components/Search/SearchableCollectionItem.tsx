'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';
import { mainnet } from 'viem/chains';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Link } from '@/components/Link.js';
import { NFTImage } from '@/components/NFTImage.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import type { EVM } from '@/providers/nftscan/types.js';

interface CollectionItemProps extends HTMLProps<HTMLAnchorElement> {
    collection: EVM.Collection;
}

export function SearchableCollectionItem({ collection, className, onClick }: CollectionItemProps) {
    const chainId = collection.chain_id ? +collection.chain_id : mainnet.id;

    return (
        <Link
            className={classNames('border-line hover:bg-bg flex items-center gap-2.5 border-b p-3', className)}
            href={resolveNFTUrl(chainId, collection.contract_address)}
            onClick={onClick}
        >
            <NFTImage
                className="size-[50px] shrink-0 rounded-lg object-cover"
                width={50}
                height={50}
                alt={collection.description}
                src={collection.logo_url}
            />
            <div>
                <div className="flex items-center gap-1">
                    <span className="text-lightMain text-lg font-bold leading-6">{collection.name}</span>
                    <ChainIcon size={18} className="shrink-0" chainId={chainId} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                    <span className="text-medium text-lightMain font-bold leading-[22px]">
                        <Trans>
                            {nFormatter(collection.items_total || 0)}{' '}
                            <span className="text-second font-normal">Items</span>
                        </Trans>
                    </span>
                    {collection.floor_price && collection.price_symbol ? (
                        <>
                            <span className="text-second">·</span>
                            <span className="text-medium text-lightMain font-bold leading-[22px]">
                                <Trans>
                                    {collection.floor_price}
                                    {collection.price_symbol} <span className="text-second font-normal">Floor</span>
                                </Trans>
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}
