'use client';

import CalendarIcon from '@dimensiondev/assets/calendar-small.svg';
import LocationIcon from '@dimensiondev/assets/location.svg';
import PoapIcon from '@dimensiondev/assets/poap.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { Fragment, memo, type ReactNode } from 'react';
import { zeroAddress } from 'viem';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { PoapTrait } from '@/components/NFTDetail/PoapTrait.js';
import { NFTImage } from '@/components/NFTImage.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useCollectionMarketInfo } from '@/hooks/useCollectionMarketInfo.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import { usePoapTraits } from '@/hooks/usePoapTraits.js';
import { type EVM } from '@/providers/nftscan/types.js';
import { type NFTDetail } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface NFTPreviewProps {
    nft: NFTDetail;
    showTradeInfo?: boolean;
    className?: string;
}

interface BasePreviewContentProps {
    collection: EVM.Collection | null | undefined;
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
    const { collection, showTradeInfo, tokenId } = props;
    const floorPrice = collection?.floor_price;
    const chainId = collection?.chain_id ? +collection.chain_id : EthereumChainId.Mainnet;
    const { data: marketInfo } = useCollectionMarketInfo(chainId, collection?.contract_address);
    const { data: nft } = useNFTDetail(chainId, collection?.contract_address, tokenId);
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
    const address = nft?.contract_address ?? collection?.contract_address;
    const link = props.link || (address ? resolveNFTUrl(chainId, address, nft?.token_id) : null);

    const content = (
        <>
            <div className="relative size-[300px]">
                <NFTImage
                    className="size-full object-cover"
                    fallbackClassName="" // remove border of Image
                    width={300}
                    height={300}
                    src={props.image}
                    alt={props.image}
                />
                {props.icon ? (
                    <span className="absolute left-3.5 top-[18px] flex items-center justify-center gap-1 rounded-xl bg-black/25 p-1">
                        {props.icon}
                    </span>
                ) : null}
                {props.tags.length ? (
                    <div className="absolute inset-x-3.5 bottom-2.5 space-y-1">
                        {props.tags.map((tag, index) => (
                            <Fragment key={index}>
                                <span className="inline-block rounded-md bg-black/25 p-1.5 text-xs font-bold text-white backdrop-blur-[3px]">
                                    {tag}
                                </span>
                                <br />
                            </Fragment>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-col gap-2 p-3">
                {props.footer ? (
                    props.footer.link && !link ? (
                        <Link className="flex items-center gap-2" href={props.footer.link} onClick={stopPropagation}>
                            {footer}
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">{footer}</div>
                    )
                ) : null}
                {showTradeInfo && (floorPrice || nft?.latest_trade_price || marketInfo?.total_volume) ? (
                    <div className="flex justify-between">
                        {floorPrice ? (
                            <div className="flex flex-col justify-start">
                                <div className="text-xs font-bold leading-[18px] text-secondary">
                                    <Trans>Price</Trans>
                                </div>
                                <div className="flex items-center gap-1 leading-[18px]">
                                    <span className="truncate text-medium font-bold text-lightMain">{floorPrice}</span>
                                    <TokenIcon
                                        disableBadge
                                        chainId={chainId}
                                        address={zeroAddress}
                                        name={collection.price_symbol}
                                        size={16}
                                    />
                                </div>
                            </div>
                        ) : null}
                        {nft?.latest_trade_price ? (
                            <div className="ml-auto flex flex-col items-end">
                                <div className="text-xs font-bold leading-[18px] text-secondary">
                                    <Trans>Last sale</Trans>
                                </div>

                                <div className="flex items-center gap-1 leading-[18px]">
                                    <span className="truncate text-medium font-bold text-lightMain">
                                        {nft.latest_trade_price}
                                    </span>
                                    <TokenIcon disableBadge chainId={chainId} address={zeroAddress} size={16} />
                                </div>
                            </div>
                        ) : !nft && marketInfo?.total_volume ? (
                            <div className="ml-auto flex flex-col items-end">
                                <div className="text-xs font-bold leading-[18px] text-secondary">
                                    <Trans>Total volume</Trans>
                                </div>

                                <div className="flex items-center gap-1 leading-[18px]">
                                    <span className="truncate text-medium font-bold text-lightMain">
                                        {marketInfo.total_volume}
                                    </span>
                                    <TokenIcon disableBadge chainId={chainId} address={zeroAddress} size={16} />
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
            {link ? <Link href={link}>{content}</Link> : content}
            {props.bookmarkProps ? (
                <BookmarkInIcon {...props.bookmarkProps} className="absolute right-5 top-[18px]" />
            ) : null}
        </div>
    );
}

export const NFTPreviewer = memo(function NFTPreview({ nft, showTradeInfo, className }: NFTPreviewProps) {
    const chainId = nft.chain_id;
    const isSolanaChain = isValidChainIdSolana(chainId);

    const isPoap = isSameEthereumAddress(nft.contract_address, POAP_CONTRACT_ADDRESS);
    const { date, position } = usePoapTraits(nft.attributes);
    const { data: collection } = useNFTCollection(nft.contract_address, chainId);
    const nftId = resolveNFTId(nft.chain_id, nft.contract_address, nft.token_id);
    const platformLogo = nft.deployPlatformLogo;

    return (
        <BasePreviewContent
            className={className}
            showTradeInfo={showTradeInfo}
            collection={collection}
            image={nft.nftscan_uri || nft.imageURL || nft.image_uri!}
            tokenId={nft.token_id}
            icon={
                isPoap ? (
                    <PoapIcon width={24} height={24} />
                ) : chainId ? (
                    <>
                        <ChainIcon className="rounded-full" size={24} chainId={chainId} />
                        {platformLogo ? (
                            <Image
                                src={platformLogo}
                                className="size-6 rounded-full"
                                alt={platformLogo}
                                width={24}
                                height={24}
                            />
                        ) : null}
                    </>
                ) : undefined
            }
            link={
                chainId ? resolveNFTUrl(chainId, nft.contract_address, isSolanaChain ? '0' : nft.token_id) : undefined
            }
            footer={
                nft.collection
                    ? {
                          image: isPoap ? undefined : (nft.collection.large_image_url ?? nft.nftscan_uri),
                          name: isPoap ? nft.name : nft.collection.name,
                          link: nft.external_link,
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
            bookmarkProps={{ nftId, ownerAddress: nft.owner }}
        />
    );
});

interface CollectionPreviewProps {
    collection: EVM.Collection;
    showTradeInfo?: boolean;
    className?: string;
}

export const CollectionPreviewer = memo(function CollectionPreviewer({
    collection,
    showTradeInfo,
    className,
}: CollectionPreviewProps) {
    const chainId = +collection.chain_id;

    return (
        <BasePreviewContent
            className={className}
            showTradeInfo={showTradeInfo}
            collection={collection}
            image={collection.large_image_url ?? collection.logo_url}
            icon={
                chainId ? (
                    <>
                        <ChainIcon className="rounded-full" size={24} chainId={chainId} />
                        {collection.deployPlatformLogo ? (
                            <Image
                                src={collection.deployPlatformLogo}
                                className="size-6 rounded-full"
                                alt={collection.deployPlatformLogo}
                                width={24}
                                height={24}
                            />
                        ) : null}
                    </>
                ) : undefined
            }
            link={collection.website}
            footer={{
                name: collection.name || t`Unknown Collection`,
            }}
            tags={EMPTY_LIST}
        />
    );
});
