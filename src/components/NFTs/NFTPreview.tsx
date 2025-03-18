import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChainId } from '@masknet/web3-shared-evm';
import { isValidChainId as isValidSolanaChainId } from '@masknet/web3-shared-solana';
import { compact, first } from 'lodash-es';
import React, { memo, type ReactNode } from 'react';
import { zeroAddress } from 'viem';

import CalendarIcon from '@/assets/calendar-small.svg';
import LocationIcon from '@/assets/location.svg';
import PoapIcon from '@/assets/poap.svg';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { PoapTrait } from '@/components/NFTDetail/PoapTrait.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { resolveNFTImageUrl } from '@/helpers/resolveNFTImageUrl.js';
import { resolveNFTUrl, resolveNFTUrlByCollection } from '@/helpers/resolveNFTUrl.js';
import { resolveSimpleHashChainId } from '@/helpers/resolveSimpleHashChain.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useCollectionMarketInfo } from '@/hooks/useCollectionMarketInfo.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { usePoapTraits } from '@/hooks/usePoapTraits.js';
import { EMPTY_LIST } from '@/mask_pkgs/shared-base/constants.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';

interface NFTPreviewProps {
    nft: SimpleHash.NFT;
    showTradeInfo?: boolean;
    className?: string;
}

interface BasePreviewContentProps {
    collection: SimpleHash.Collection | null | undefined;
    tokenId?: string;
    image: string;
    footer?: {
        name: string;
        image?: string;
        link?: string;
    };
    tags: ReactNode[];
    icon?: ReactNode;
    link?: string;
    bookmarkProps?: {
        nftId: string;
        ownerAddress?: string;
    };
    showTradeInfo?: boolean;
    className?: string;
}

function BasePreviewContent(props: BasePreviewContentProps) {
    const { collection, showTradeInfo } = props;
    const floorPrice = collection?.floor_prices[0];
    const { data: marketInfo } = useCollectionMarketInfo(collection?.collection_id);
    const chainId = (collection?.chains[0] && resolveSimpleHashChainId(collection?.chains[0])) || ChainId.Mainnet;
    const footer = (
        <>
            {props.footer?.image ? (
                <Image
                    className="rounded-md object-cover"
                    width={18}
                    height={18}
                    src={props.footer.image}
                    alt={props.footer.name}
                />
            ) : null}
            <h2 className="min-w-0 flex-1 truncate text-medium font-bold text-lightMain">{props.footer?.name}</h2>
        </>
    );
    const content = (
        <>
            <div className="relative size-[300px]">
                <Image
                    className="h-full w-full object-cover"
                    width={300}
                    height={300}
                    src={props.image}
                    alt={props.image}
                />
                {props.icon ? (
                    <span className="absolute left-3.5 top-[18px] flex size-8 items-center justify-center rounded-xl bg-black/25">
                        {props.icon}
                    </span>
                ) : null}
                {props.tags.length ? (
                    <div className="absolute inset-x-3.5 bottom-2.5 space-y-1">
                        {props.tags.map((tag, index) => (
                            <React.Fragment key={index}>
                                <span className="inline-block rounded-md bg-black/25 p-1.5 text-xs font-bold text-white backdrop-blur-[3px]">
                                    {tag}
                                </span>
                                <br />
                            </React.Fragment>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-col gap-[20px] p-3">
                {props.footer ? (
                    props.footer.link ? (
                        <Link className="flex items-center gap-2" href={props.footer.link} onClick={stopPropagation}>
                            {footer}
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">{footer}</div>
                    )
                ) : null}
                {showTradeInfo ? (
                    <div className="flex justify-between">
                        {floorPrice ? (
                            <div className="flex flex-col justify-start gap-1">
                                <div className="text-xs font-bold leading-6">
                                    <Trans>Price</Trans>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="truncate text-medium font-bold text-lightMain">
                                        {formatBalance(floorPrice.value, floorPrice.payment_token.decimals)}
                                    </span>
                                    <TokenIcon
                                        disableBadge
                                        chainId={chainId}
                                        address={floorPrice.payment_token.address || zeroAddress}
                                        icon={`https://stamp.firefly.land/logo/${chainId}/${floorPrice.payment_token.address || zeroAddress}`}
                                        size={16}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {marketInfo ? (
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-xs font-bold leading-6">
                                    <Trans>Total Volume</Trans>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span className="truncate text-medium font-bold text-lightMain">
                                        {formatBalance(marketInfo?.all_time_volume, marketInfo.payment_token.decimals)}
                                    </span>
                                    <TokenIcon
                                        disableBadge
                                        chainId={chainId}
                                        address={marketInfo.payment_token.address || zeroAddress}
                                        icon={`https://stamp.firefly.land/logo/${chainId}/${marketInfo.payment_token.address || zeroAddress}`}
                                        size={16}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </>
    );

    return (
        <div
            className={classNames('relative w-[300px] overflow-hidden rounded-xl bg-bg text-left', props.className)}
            onClick={stopPropagation}
        >
            {props.link ? <Link href={props.link}>{content}</Link> : content}
            {props.bookmarkProps ? (
                <BookmarkInIcon {...props.bookmarkProps} className="absolute right-5 top-[18px]" />
            ) : null}
        </div>
    );
}

export const NFTPreviewer = memo(function NFTPreview({ nft, showTradeInfo, className }: NFTPreviewProps) {
    const chainId = resolveSimpleHashChainId(nft.chain);
    const collectionId = nft.collection.collection_id;
    const isSolanaChain = isValidSolanaChainId(chainId);

    const isPoap = isSameEthereumAddress(nft.contract_address, POAP_CONTRACT_ADDRESS);
    const { date, position } = usePoapTraits(nft.extra_metadata.attributes);
    const { data: collection } = useNFTCollection(nft.contract_address, chainId);

    return (
        <BasePreviewContent
            className={className}
            showTradeInfo={showTradeInfo}
            collection={collection}
            image={resolveNFTImageUrl(nft)}
            icon={
                isPoap ? (
                    <PoapIcon width={24} height={24} />
                ) : chainId ? (
                    <ChainIcon className="rounded-full" size={24} chainId={chainId} />
                ) : undefined
            }
            link={
                chainId ? resolveNFTUrl(chainId, nft.contract_address, isSolanaChain ? '0' : nft.token_id) : undefined
            }
            footer={
                nft.collection?.collection_id
                    ? {
                          image: isPoap ? undefined : nft.collection.image_url,
                          name: isPoap ? nft.name : nft.collection.name,
                          link: isPoap ? undefined : collectionId ? resolveNFTUrlByCollection(collectionId) : undefined,
                      }
                    : undefined
            }
            tags={
                isPoap
                    ? compact([
                          <PoapTrait noWrap icon={LocationIcon} value={position} key="position" />,
                          <PoapTrait noWrap icon={CalendarIcon} value={date} key="date" />,
                      ])
                    : [nft.name || nft.collection.name]
            }
            bookmarkProps={{ nftId: nft.nft_id, ownerAddress: first(nft.owners)?.owner_address }}
        />
    );
});

interface CollectionPreviewProps {
    collection: SimpleHash.Collection;
    showTradeInfo?: boolean;
    className?: string;
}
export const CollectionPreviewer = memo(function CollectionPreviewer({
    collection,
    showTradeInfo,
    className,
}: CollectionPreviewProps) {
    const chainId = resolveSimpleHashChainId(collection.chains[0]);

    return (
        <BasePreviewContent
            className={className}
            showTradeInfo={showTradeInfo}
            collection={collection}
            image={collection.image_url}
            icon={chainId ? <ChainIcon className="rounded-full" size={24} chainId={chainId} /> : undefined}
            link={resolveNFTUrlByCollection(collection.collection_id)}
            footer={{
                name: collection.name || t`Unknown Collection`,
            }}
            tags={EMPTY_LIST}
        />
    );
});
