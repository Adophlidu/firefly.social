'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { Trans } from '@lingui/react/macro';

import { CollectionMore } from '@/components/Actions/CollectionMore.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { NFTImage } from '@/components/NFTImage.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface CollectionInfoProps {
    address: string;
    floorPrice?: string;
    nftCount?: number;
    ownerCount?: number;
    volume24h?: string;
    bannerImageUrl?: string;
    logoUrl: string;
    name: string;
    chainId?: EthereumChainId;
    externalUrl?: string;
}

export function CollectionInfo(props: CollectionInfoProps) {
    const {
        chainId = EthereumChainId.Mainnet,
        address,
        name,
        bannerImageUrl,
        logoUrl,
        nftCount,
        ownerCount,
        volume24h,
        floorPrice,
        externalUrl,
    } = props;
    const isMedium = useIsMedium();

    return (
        <div className="w-full">
            <Image
                width={1000}
                height={1000}
                src={bannerImageUrl || '/image/nft-collection-fallback.webp'}
                alt={name}
                fallback="/image/nft-collection-fallback.webp"
                className="h-[150px] w-full object-cover"
            />
            <div className="flex w-full p-3">
                <NFTImage
                    width={115}
                    height={115}
                    className="size-[115px] rounded-lg object-cover"
                    src={logoUrl}
                    alt={name}
                />
                <div className="ml-2.5 flex h-[115px] min-w-0 flex-1 flex-col justify-between">
                    <div className="flex w-full gap-2 text-xl font-bold leading-6">
                        <TextOverflowTooltip content={name}>
                            <div className="line-clamp-2 w-full">{name}</div>
                        </TextOverflowTooltip>
                        <CollectionMore chainId={chainId} address={address} externalUrl={externalUrl} />
                    </div>
                    {address ? (
                        <div className="text-secondary flex items-center gap-1 text-[14px] leading-[14px]">
                            <ChainIcon className="shrink-0" chainId={chainId} size={14} />
                            <span className="min-w-0 truncate">{isMedium ? address : formatAddress(address, 4)}</span>
                            <CopyTextButton size={14} text={address} />
                            <a className="size-3.5" href={resolveAddressLink(chainId, address)} target="_blank">
                                <LinkIcon className="text-secondary size-3.5" />
                            </a>
                        </div>
                    ) : null}
                    <div className="flex items-center space-x-2 whitespace-nowrap text-sm leading-[22px]">
                        {nftCount ? (
                            <div>
                                <div className="font-bold">{nFormatter(nftCount)}</div>
                                <div className="text-secondary">
                                    <Trans>Items</Trans>
                                </div>
                            </div>
                        ) : null}
                        {ownerCount ? (
                            <>
                                <div className="text-secondary mx-2 w-3">·</div>
                                <div>
                                    <div className="font-bold">{nFormatter(ownerCount)}</div>
                                    <div className="text-secondary">
                                        <Trans>Owners</Trans>
                                    </div>
                                </div>
                            </>
                        ) : null}
                        {volume24h ? (
                            <>
                                <div className="text-secondary mx-2 w-3">·</div>
                                <div>
                                    <div className="font-bold">{volume24h}</div>
                                    <div className="text-secondary">
                                        <Trans>24H Volume</Trans>
                                    </div>
                                </div>
                            </>
                        ) : null}
                        {floorPrice ? (
                            <>
                                <div className="text-secondary mx-2 w-3">·</div>
                                <div>
                                    <div className="font-bold">{floorPrice}</div>
                                    <div className="text-secondary">
                                        <Trans>Floor Price</Trans>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
