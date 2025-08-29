import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Link } from '@/components/Link.js';
import { NFTImage } from '@/components/NFTImage.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import type { TrendingNFT } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface CollectionItemProps extends HTMLProps<HTMLAnchorElement> {
    collection: TrendingNFT;
}

export function TrendingNFT({ collection, className, ...rest }: CollectionItemProps) {
    const chainId = collection.chain_id ? +collection.chain_id : EthereumChainId.Mainnet;

    return (
        <Link
            className={classNames('flex items-center gap-2.5 border-b border-line p-3 hover:bg-bg', className)}
            {...rest}
            href={resolveNFTUrl(chainId, collection.contract_address)}
        >
            <NFTImage
                className="size-[50px] shrink-0 rounded-lg object-cover"
                width={50}
                height={50}
                alt={collection.contract_name}
                src={collection.logo_url}
            />
            <div className="flex grow flex-col">
                <div className="flex items-center gap-1">
                    <span className="text-lg font-bold leading-6 text-lightMain">{collection.contract_name}</span>
                    <ChainIcon size={18} className="shrink-0" chainId={chainId} />
                </div>
                <div className="mt-1 flex grow items-center gap-2">
                    <span className="whitespace-nowrap text-medium font-bold leading-[22px] text-lightMain">
                        <Trans>
                            {nFormatter(collection.collection.amounts_total || collection.items_total || 0)}{' '}
                            <span className="font-normal text-second"> Items</span>
                        </Trans>
                    </span>
                    {collection.floor_price && collection.price_symbol ? (
                        <>
                            <span className="text-second">·</span>
                            <span className="whitespace-nowrap text-medium font-bold leading-[22px] text-lightMain">
                                <Trans>
                                    {collection.floor_price} {collection.price_symbol}{' '}
                                    <span className="font-normal text-second">Floor</span>
                                </Trans>
                            </span>
                        </>
                    ) : null}
                    {collection.volume_1d ? (
                        <>
                            <span className="text-second">·</span>
                            <span className="whitespace-nowrap text-medium font-bold leading-[22px] text-lightMain">
                                <Trans>
                                    {collection.volume_1d} {collection.price_symbol}{' '}
                                    <span className="font-normal text-second">24H Vol</span>
                                </Trans>
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}
