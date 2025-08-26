'use client';

import { Trans } from '@lingui/react/macro';
import { pick } from 'lodash-es';

import AcquiredIcon from '@/assets/acquired.svg';
import BoughtIcon from '@/assets/bought.svg';
import BurnIcon from '@/assets/burn.svg';
import MintIcon from '@/assets/minted.svg';
import SentIcon from '@/assets/sent.svg';
import SoldIcon from '@/assets/sold.svg';
import { ActivityCellAction } from '@/components/ActivityCell/ActivityCellAction.js';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { type EVM as NFTScanEVM, TransEventType } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface Props {
    chainId: EthereumChainId;
    address: string;
    tokenId: string;
    action: TransEventType;
    tokenCount?: number;
    ownerAddress?: string;
    toAddress?: string;
    fromAddress?: string;
    nft: NFTScanEVM.Asset | null;
}

const tagClassName = 'flex items-center space-x-1 rounded-lg bg-bg px-2 h-6 leading-6 truncate cursor-pointer';

function NFTsActivityCellActionCollectionName({
    asset,
    chainId,
    address,
}: { asset: NFTScanEVM.Asset | null } & Pick<Props, 'chainId' | 'address'>) {
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

function NFTsActivityCellActionPoapName({
    asset,
    chainId,
    address,
}: { asset?: NFTScanEVM.Asset | null } & Pick<Props, 'chainId' | 'address'>) {
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
    const { action, toAddress, ownerAddress, fromAddress, tokenCount, nft: data } = props;

    switch (action) {
        case TransEventType.Mint:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<MintIcon />}>Minted</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
                        {tokenCount && tokenCount > 1 ? <div className={tagClassName}>× {tokenCount}</div> : null}
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
                                <NFTsActivityCellActionCollectionName
                                    asset={data}
                                    {...pick(props, 'chainId', 'address')}
                                />
                                <span>from</span>
                                <ClickableArea className="whitespace-nowrap">
                                    <Link
                                        href={getProfileUrl({ source: Source.Wallet, profileId: fromAddress })}
                                        className="truncate text-highlight hover:underline"
                                    >
                                        {formatAddressEthereum(fromAddress, 4)}
                                    </Link>
                                </ClickableArea>
                            </Trans>
                        ) : (
                            <Trans>
                                <ActivityCellActionTag icon={<AcquiredIcon />}>Acquired</ActivityCellActionTag>
                                <NFTsActivityCellActionCollectionName
                                    asset={data}
                                    {...pick(props, 'chainId', 'address')}
                                />
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
                            <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
                            <span>to</span>
                            <ClickableArea className="whitespace-nowrap">
                                <Link
                                    href={getProfileUrl({ source: Source.Wallet, profileId: toAddress })}
                                    className="truncate text-highlight hover:underline"
                                >
                                    {formatAddressEthereum(toAddress, 4)}
                                </Link>
                            </ClickableArea>
                        </Trans>
                    ) : (
                        <Trans>
                            <ActivityCellActionTag icon={<SentIcon />}>Sent</ActivityCellActionTag>
                            <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
                        </Trans>
                    )}
                </ActivityCellAction>
            );
        case TransEventType.Burn:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<BurnIcon />}>Burned</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
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
                            <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
                        </Trans>
                    </ActivityCellAction>
                );
            }
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<SoldIcon />}>Sold</ActivityCellActionTag>
                        <NFTsActivityCellActionCollectionName asset={data} {...pick(props, 'chainId', 'address')} />
                    </Trans>
                </ActivityCellAction>
            );
        case TransEventType.Poap:
            return (
                <ActivityCellAction>
                    <Trans>
                        <ActivityCellActionTag icon={<MintIcon />}>Collected</ActivityCellActionTag>
                        <NFTsActivityCellActionPoapName asset={data} {...pick(props, 'chainId', 'address')} />
                    </Trans>
                </ActivityCellAction>
            );
        default:
            safeUnreachable(action);
            return null;
    }
}
