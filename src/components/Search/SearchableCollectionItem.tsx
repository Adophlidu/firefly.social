import { Trans } from '@lingui/react/macro';
import { ChainId } from '@masknet/web3-shared-evm';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveNftUrl } from '@/helpers/resolveNftUrl.js';
import type { NFTScan } from '@/providers/types/NFTScan.js';

interface CollectionItemProps extends HTMLProps<HTMLAnchorElement> {
    collection: NFTScan.Collection;
}

export function SearchableCollectionItem({ collection, className, onClick }: CollectionItemProps) {
    const chainId = collection.chain_id || ChainId.Mainnet;

    return (
        <Link
            className={classNames('flex items-center gap-x-2.5 border-b border-line p-3 hover:bg-bg', className)}
            href={resolveNftUrl(chainId, collection.contract_address)}
            onClick={onClick}
        >
            <Image
                className="h-[50px] w-[50px] shrink-0 rounded-lg object-cover"
                width={50}
                height={50}
                alt={collection.description}
                src={collection.logo_url}
            />
            <div>
                <div className="flex items-center gap-x-1">
                    <span className="text-lg font-bold leading-6 text-lightMain">{collection.name}</span>
                    <ChainIcon size={18} className="shrink-0" chainId={chainId} />
                </div>
                <div className="mt-1 flex items-center gap-x-2">
                    <span className="text-medium font-bold leading-[22px] text-lightMain">
                        <Trans>
                            {nFormatter(collection.items_total || 0)}
                            <span className="font-normal text-lightSecond"> Items</span>
                        </Trans>
                    </span>
                    {collection.floor_price && collection.price_symbol ? (
                        <>
                            <span className="text-lightSecond">·</span>
                            <span className="text-medium font-bold leading-[22px] text-lightMain">
                                <Trans>
                                    {collection.floor_price}
                                    {collection.price_symbol}
                                    <span className="font-normal text-lightSecond"> Floor</span>
                                </Trans>
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}
