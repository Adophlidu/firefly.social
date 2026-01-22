'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import CalendarIcon from '@/assets/calendar.svg';
import LocationIcon from '@/assets/location.svg';
import PoapIcon from '@/assets/poap.svg';
import WebsiteIcon from '@/assets/website-circle.svg';
import { NFTDetailsMore } from '@/components/Actions/NFTDetailsMore.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { NFTInfoPreview } from '@/components/NFTDetail/NFTInfoPreview.js';
import { PoapTrait } from '@/components/NFTDetail/PoapTrait.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { FreeMintButton } from '@/components/NFTs/FreeMintButton.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { Source } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { useCollectionMarketInfo } from '@/hooks/useCollectionMarketInfo.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { usePoapTraits } from '@/hooks/usePoapTraits.js';
import { type EVM } from '@/providers/nftscan/types.js';
import { type NonFungibleTokenTrait } from '@/web3-shared/base/specs.js';

interface NFTInfoProps {
    ownerAddress?: string;
    contractAddress?: string;
    disableBookmark?: boolean;
    disableReport?: boolean;
    imageURL: string;
    videoURL?: string;
    name: string;
    tokenId: string;
    collection?: {
        name: string;
        icon?: string;
    };
    chainId: number;
    attendance?: number;
    isPoap?: boolean;
    externalUrl?: string | null;
    traits: NonFungibleTokenTrait[] | EVM.Attribute[];
    platformLogo?: string;
}

export function NFTInfo(props: NFTInfoProps) {
    const {
        imageURL,
        videoURL,
        name,
        tokenId,
        collection,
        ownerAddress,
        chainId,
        contractAddress,
        disableBookmark,
        disableReport,
        attendance,
        isPoap = false,
        externalUrl,
        traits,
        platformLogo,
    } = props;
    const isMedium = useIsMedium();
    const { data: ensName } = useEnsName(ownerAddress);
    const { data: marketInfo } = useCollectionMarketInfo(chainId, contractAddress);

    const collectionUrl = contractAddress ? resolveNFTUrl(chainId, contractAddress) : '';
    const nftUrl = contractAddress ? resolveNFTUrl(chainId, contractAddress, tokenId || '0') : '';

    const poapTraits = usePoapTraits(traits);

    const action = isPoap ? null : (
        <FreeMintButton
            contractAddress={contractAddress || ''}
            chainId={chainId}
            tokenId={tokenId}
            externalUrl={externalUrl}
        />
    );

    const ownerContent = (
        <>
            <span className="leading-4 text-second">
                {isPoap ? <Trans>Collected by</Trans> : <Trans>Owned By</Trans>}
            </span>
            <TextOverflowTooltip content={ensName ?? ownerAddress}>
                <span className="block truncate font-bold text-main">
                    {!ownerAddress ? '-' : ensName ? ensName : formatAddress(ownerAddress, 4)}
                </span>
            </TextOverflowTooltip>
        </>
    );

    return (
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <div className="relative mx-auto flex size-[230px] items-center justify-center md:min-w-[230px]">
                {isPoap || chainId ? (
                    <div className="absolute left-2.5 top-2.5 z-10 flex gap-1 rounded-xl bg-black/25 p-1">
                        {isPoap ? (
                            <PoapIcon width={24} height={24} />
                        ) : (
                            <>
                                <ChainIcon className="rounded-full" chainId={chainId} size={24} />
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
                        )}
                    </div>
                ) : null}
                {contractAddress && !disableBookmark ? (
                    <BookmarkInIcon
                        className="absolute right-2.5 top-2.5 z-10"
                        nftId={resolveNFTId(chainId, contractAddress, tokenId, false)}
                        ownerAddress={ownerAddress}
                    />
                ) : null}
                <NFTInfoPreview name={name} imageURL={imageURL} video={videoURL} />
            </div>
            <div className="flex w-full flex-1 flex-col md:w-[calc(100%-20px-230px)]">
                <div className={classNames('flex size-full flex-col', !isMedium ? 'gap-2' : 'justify-between')}>
                    {!isPoap && collection ? (
                        <div className="flex h-5 w-full items-center justify-between text-base font-bold leading-6">
                            <Link className="flex min-w-0 flex-1 items-center" href={collectionUrl}>
                                {collection.icon ? (
                                    <Image
                                        width={20}
                                        height={20}
                                        alt={collection.name}
                                        className="mr-1 size-5 rounded-md shadow"
                                        src={collection.icon}
                                    />
                                ) : null}
                                <TextOverflowTooltip content={collection.name}>
                                    <div className="max-w-[calc(100%-20px-16px-8px-8px)] truncate">
                                        {collection.name || <Trans>Unknown Collection</Trans>}
                                    </div>
                                </TextOverflowTooltip>
                            </Link>
                            <NFTDetailsMore
                                chainId={chainId}
                                address={contractAddress}
                                nftUrl={nftUrl}
                                nftImage={imageURL}
                            />
                        </div>
                    ) : null}
                    <div className="flex w-full justify-between">
                        <TextOverflowTooltip content={name}>
                            <div
                                className={classNames(
                                    'w-full text-left text-xl font-bold leading-6',
                                    isPoap ? 'line-clamp-3' : 'line-clamp-2',
                                )}
                            >
                                {name}
                            </div>
                        </TextOverflowTooltip>
                        {isPoap && contractAddress ? (
                            <NFTDetailsMore
                                chainId={chainId}
                                address={contractAddress}
                                nftUrl={nftUrl}
                                nftImage={imageURL}
                                disableReport={disableReport}
                            />
                        ) : null}
                    </div>
                    {isPoap ? (
                        <ul className="w-full space-y-1 text-medium text-second">
                            <PoapTrait value={poapTraits.position} icon={LocationIcon} />
                            <PoapTrait value={poapTraits.date} icon={CalendarIcon} />
                            <PoapTrait url={poapTraits.eventURL} icon={WebsiteIcon} />
                        </ul>
                    ) : null}
                    <div className="flex w-full gap-2">
                        {ownerAddress ? (
                            <Link
                                href={getProfileUrl({ source: Source.Wallet, profileId: ownerAddress })}
                                target="_blank"
                                className="h-[68px] min-w-0 flex-1 space-y-1.5 rounded-lg bg-lightBg p-2.5 text-base"
                            >
                                {ownerContent}
                            </Link>
                        ) : (
                            <div className="h-[68px] flex-1 space-y-1.5 rounded-lg bg-lightBg p-2.5 text-base">
                                {ownerContent}
                            </div>
                        )}
                        {isPoap ? (
                            <div className="h-[68px] flex-1 space-y-1.5 rounded-lg bg-lightBg p-2.5 text-base">
                                <span className="leading-4 text-second">
                                    <Trans>Attendance</Trans>
                                </span>
                                <span className="block truncate font-bold text-main">
                                    {attendance ? attendance.toLocaleString() : '-'}
                                </span>
                            </div>
                        ) : (
                            <div className="h-[68px] flex-1 space-y-1.5 rounded-lg bg-lightBg p-2.5 text-base">
                                <span className="leading-4 text-second">
                                    <Trans>Floor Price</Trans>
                                </span>
                                <span className="block truncate font-bold text-main">
                                    {marketInfo?.floor_price ?? '-'}
                                </span>
                            </div>
                        )}
                    </div>
                    {action}
                </div>
            </div>
        </div>
    );
}
