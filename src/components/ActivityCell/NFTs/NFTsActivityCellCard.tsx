'use client';

import { memo } from 'react';

import CalendarIcon from '@/assets/calendar.svg';
import LocationIcon from '@/assets/location.svg';
import PoapIcon from '@/assets/poap.svg';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { NFTVideo } from '@/components/NFTDetail/NFTInfoPreview.js';
import { NFTImage } from '@/components/NFTImage.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { usePoapTraits } from '@/hooks/usePoapTraits.js';
import { type EVM, TransEventType } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface Props {
    address: string;
    tokenId: string;
    chainId: EthereumChainId;
    action: TransEventType;
    ownerAddress: string;
    bookmarked?: boolean;
    nft: EVM.Asset;
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

export function NFTsActivityCellCard(props: Props) {
    const { address, tokenId, chainId, action, ownerAddress, bookmarked, nft: data } = props;
    const imageURL = data.image_uri || data.content_uri || data.nftscan_uri!;

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
                                    'h-auto max-h-[500px] min-h-[150px] w-[250px] min-w-[150px] cursor-pointer rounded-t-xl bg-lightBg object-cover dark:bg-bg md:w-[300px]',
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
                                'h-auto max-h-[500px] min-h-[150px] w-[250px] min-w-[150px] rounded-t-xl bg-lightBg object-cover dark:bg-bg md:w-[300px]',
                                {
                                    'rounded-b-xl': true,
                                },
                            )}
                            alt="nft-card"
                            fallbackClassName=""
                            width={200}
                            height={200}
                        />
                    )}
                    <div className="absolute bottom-0 left-0 flex max-w-[100%] flex-col space-y-1 px-[15px] pb-3">
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
                    <div className="absolute left-[14px] top-3 flex size-8 items-center justify-center rounded-xl bg-black/25">
                        <ChainIcon className="rounded-full" chainId={chainId} size={24} />
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
