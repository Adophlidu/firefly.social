'use client';

import AcquiredIcon from '@dimensiondev/assets/acquired.svg';
import BoughtIcon from '@dimensiondev/assets/bought.svg';
import BurnIcon from '@dimensiondev/assets/burn.svg';
import MintIcon from '@dimensiondev/assets/minted.svg';
import SentIcon from '@dimensiondev/assets/sent.svg';
import SoldIcon from '@dimensiondev/assets/sold.svg';
import { Source, TransEventType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { formatAddressEthereum, isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';

import { ActivityCellAction } from '@/components/ActivityCell/ActivityCellAction.js';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import type { EVM as NFTScanEVM } from '@/providers/nftscan/types.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';

interface Props {
    feed: NFTFeedV3;
    chainId: number;
    tokenId: string;
    tokenCount?: number;
}

const tagClassName = 'flex items-center space-x-1 rounded-lg bg-bg px-2 h-6 leading-6 truncate cursor-pointer';

interface CollectionNameProps {
    asset: NFTScanEVM.Asset | null;
    chainId: number;
    address: string;
}

function NFTsActivityCellActionCollectionName({ asset, chainId, address }: CollectionNameProps) {
    if (!asset) return null;
    return (
        <Link
            href={resolveNFTUrl(chainId, address)}
            className={tagClassName}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            {asset.imageURL ? (
                <Image
                    src={asset.imageURL}
                    alt={asset.contract_name}
                    className="size-[18px] shrink-0 rounded-[6px]"
                    width={18}
                    height={18}
                />
            ) : null}
            <div className="truncate">{asset.contract_name}</div>
        </Link>
    );
}

function NFTsActivityCellActionPoapName({ asset, chainId, address }: CollectionNameProps) {
    if (!asset?.contract_name) return null;

    return (
        <Link href={resolveNFTUrl(chainId, address)} className={tagClassName}>
            {asset.imageURL ? (
                <Image src={asset.imageURL} alt={asset.contract_name} className="size-[18px] shrink-0 rounded-[6px]" />
            ) : null}
            <div className="truncate">{asset.contract_name}</div>
        </Link>
    );
}

export function NFTsActivityCellAction(props: Props) {
    const { tokenCount, feed } = props;
    const collectionProps: CollectionNameProps = {
        chainId: props.chainId,
        address: feed.contract_address,
        asset: feed.detail,
    };
    const { event_type: action, receive: toAddress, send: fromAddress, owner: ownerAddress } = feed;

    switch (action) {
        case TransEventType.Mint:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<MintIcon />}>Minted</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName {...collectionProps} />
                        {tokenCount && tokenCount > 1 ? <div className={tagClassName}>× {tokenCount}</div> : null}
                        {feed.deployPlatform && feed.deployPlatformLogo ? (
                            <div className="flex items-center gap-1">
                                on
                                <Image
                                    src={feed.deployPlatformLogo}
                                    className="size-[18px] rounded-full"
                                    alt={feed.deployPlatform}
                                    width={18}
                                    height={18}
                                />
                                <span className="h-6 capitalize leading-6">{feed.deployPlatform}</span>
                            </div>
                        ) : null}
                    </Trans>
                </ActivityCellAction>
            );
        case TransEventType.Transfer:
            const isAcquired = isSameEthereumAddress(toAddress, ownerAddress);
            if (isAcquired) {
                return (
                    <ActivityCellAction>
                        {fromAddress ? (
                            <Trans>
                                <ActivityCellActionTag icon={<AcquiredIcon />}>Acquired</ActivityCellActionTag>
                                <NFTsActivityCellActionCollectionName {...collectionProps} />
                                <span>from</span>
                                <ClickableArea className="whitespace-nowrap">
                                    <Link
                                        href={getProfileUrl({ source: Source.Wallet, profileId: fromAddress })}
                                        className="text-highlight truncate hover:underline"
                                    >
                                        {formatAddressEthereum(fromAddress, 4)}
                                    </Link>
                                </ClickableArea>
                            </Trans>
                        ) : (
                            <Trans>
                                <ActivityCellActionTag icon={<AcquiredIcon />}>Acquired</ActivityCellActionTag>
                                <NFTsActivityCellActionCollectionName {...collectionProps} />
                            </Trans>
                        )}
                    </ActivityCellAction>
                );
            }
            return (
                <ActivityCellAction>
                    {toAddress ? (
                        <Trans>
                            <ActivityCellActionTag icon={<SentIcon />}>Sent</ActivityCellActionTag>
                            <NFTsActivityCellActionCollectionName {...collectionProps} />
                            <span>to</span>
                            <ClickableArea className="whitespace-nowrap">
                                <Link
                                    href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                                    className="text-highlight truncate hover:underline"
                                >
                                    {formatAddressEthereum(toAddress, 4)}
                                </Link>
                            </ClickableArea>
                        </Trans>
                    ) : (
                        <Trans>
                            <ActivityCellActionTag icon={<SentIcon />}>Sent</ActivityCellActionTag>
                            <NFTsActivityCellActionCollectionName {...collectionProps} />
                        </Trans>
                    )}
                </ActivityCellAction>
            );
        case TransEventType.Burn:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<BurnIcon />}>Burned</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName {...collectionProps} />
                    </Trans>
                </ActivityCellAction>
            );
        case TransEventType.Sale:
            const isBuy = isSameEthereumAddress(toAddress, ownerAddress);
            if (isBuy) {
                return (
                    <ActivityCellAction>
                        <Trans>
                            <ActivityCellActionTag icon={<BoughtIcon />}>Bought</ActivityCellActionTag>
                            <NFTsActivityCellActionCollectionName {...collectionProps} />
                        </Trans>
                    </ActivityCellAction>
                );
            }
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<SoldIcon />}>Sold</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName {...collectionProps} />
                    </Trans>
                </ActivityCellAction>
            );
        case TransEventType.Poap:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<MintIcon />}>Collected</ActivityCellActionTag>
                        <NFTsActivityCellActionPoapName {...collectionProps} />
                    </Trans>
                </ActivityCellAction>
            );
        default:
            safeUnreachable(action);
            return null;
    }
}
