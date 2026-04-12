'use client';

import CalendarIcon from '@dimensiondev/assets/calendar.svg';
import LocationIcon from '@dimensiondev/assets/location.svg';
import PoapIcon from '@dimensiondev/assets/poap.svg';
import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { NFTVideo } from '@/components/NFTDetail/NFTInfoPreview.js';
import { NFTImage } from '@/components/NFTImage.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { usePoapTraits } from '@/hooks/usePoapTraits.js';
import { type EVM, TransEventType } from '@/providers/nftscan/types.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

interface NFTsActivityCellCardProps {
    tokenId: string;
    chainId: EthereumChainId;
    feed: NFTFeedV3;
}

const PoapTags = memo(function PoapTags({ asset }: { asset: EVM.Asset }) {
    const { date, position } = usePoapTraits(asset.attributes || [], 'MMMDD');

    return (
        <>
            {position ? (
                <div className="flex items-center space-x-1 truncate rounded-lg bg-black/25 p-1.5 text-sm font-bold text-white backdrop-blur-lg">
                    <LocationIcon width={15} height={15} className="mr-1 shrink-0" />
                    {position}
                </div>
            ) : null}
            {date ? (
                <div className="flex items-center space-x-1 truncate rounded-lg bg-black/25 p-1.5 text-sm font-bold text-white backdrop-blur-lg">
                    <CalendarIcon width={15} height={15} className="mr-1 shrink-0" />
                    {date}
                </div>
            ) : null}
        </>
    );
});

export function NFTsActivityCellCard(props: NFTsActivityCellCardProps) {
    const { tokenId, chainId, feed } = props;
    const { event_type: action, owner: ownerAddress, contract_address: address, bookmarked, detail: data } = feed;
    if (!data) return null;
    const imageURL = data.image_uri || data.content_uri || data.nftscan_uri || data.collection?.logo_url!;

    const isPoap = action === TransEventType.Poap;
    const isVideo = imageURL?.match(/\.(mp4|webm|ogg|avi|mkv)$/i);

    return (
        <div className="relative">
            <Link
                href={resolveNFTUrl(chainId, address, tokenId)}
                className="relative flex w-auto shrink-0 flex-col"
                data-disable-progress={!!isVideo}
            >
                <div className="relative">
                    {isVideo ? (
                        <ClickableArea>
                            <NFTVideo
                                className={classNames(
                                    'bg-lightBg dark:bg-bg h-auto max-h-[500px] min-h-[150px] w-[250px] min-w-[150px] cursor-pointer rounded-t-xl object-cover md:w-[300px]',
                                    {
                                        'rounded-b-xl': true,
                                    },
                                )}
                                video={imageURL}
                                imageURL={imageURL}
                            />
                        </ClickableArea>
                    ) : (
                        <NFTImage
                            src={imageURL}
                            className={classNames(
                                'bg-lightBg dark:bg-bg h-auto max-h-[500px] min-h-[150px] w-[250px] min-w-[150px] rounded-t-xl object-cover md:w-[300px]',
                                {
                                    'rounded-b-xl': true,
                                },
                            )}
                            alt="nft-card"
                            fallback={data.nftscan_uri || data.collection?.logo_url}
                            width={200}
                            height={200}
                        />
                    )}
                    <div className="absolute bottom-0 left-0 flex max-w-full flex-col space-y-1 px-[15px] pb-3">
                        {isPoap ? (
                            <PoapTags asset={data} />
                        ) : (
                            <div className="truncate rounded-lg bg-black/25 p-1.5 text-sm font-bold text-white backdrop-blur-lg">
                                {data.name || `#${tokenId}`}
                            </div>
                        )}
                    </div>
                </div>
                {isPoap ? (
                    <PoapIcon width={32} height={32} className="absolute left-[14px] top-3" />
                ) : (
                    <div className="absolute left-[14px] top-3 flex items-center justify-center gap-1 rounded-xl bg-black/25 p-1">
                        <ChainIcon className="rounded-full" chainId={chainId} size={24} />
                        {feed.deployPlatformLogo ? (
                            <Image
                                src={feed.deployPlatformLogo}
                                className="size-6 rounded-full"
                                alt={feed.deployPlatform || 'Mint platform'}
                                width={24}
                                height={24}
                            />
                        ) : null}
                    </div>
                )}
            </Link>
            <div className="absolute right-[14px] top-3">
                <BookmarkInIcon
                    nftId={resolveNFTId(chainId, address, tokenId)}
                    ownerAddress={ownerAddress}
                    bookmarked={bookmarked}
                />
            </div>
        </div>
    );
}
