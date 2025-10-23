'use client';

import { Select, Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { first } from 'lodash-es';
import { memo } from 'react';
import { type Address } from 'viem';

import { AddressLink, TxLink } from '@/app/(normal)/tx/[chain_id]/[hash]/components/TxLink.js';
import ExchangeIcon from '@/assets/exchange.svg';
import ExportIcon from '@/assets/export.svg';
import MoreIcon from '@/assets/more-circle.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Comeback } from '@/components/Comeback.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { SwapActions } from '@/components/Swap/SwapActions.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { chains } from '@/configs/chains.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { type SwapActivity } from '@/providers/types/Firefly.js';

interface SwapDetailProps {
    activity?: SwapActivity;
}

export const SwapDetail = memo<SwapDetailProps>(function SwapDetail({ activity }) {
    const addressName = formatAddress(activity?.owner ?? '', 4);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: activity?.owner });

    if (!activity) {
        notFound();
    }

    const explorerLink =
        activity.chain_id !== 101
            ? resolveExplorerLink(activity.chain_id, activity.hash, 'tx')
            : `https://solscan.io/tx/${activity.hash}`;

    const contractLink = resolveAddressLink(activity.chain_id, activity.router_address);

    const chain = activity.chain_id !== 101 ? chains.find((x) => x.id === activity.chain_id) : null;
    const isCrossChain = activity.is_cross_chain;

    return (
        <div className="flex flex-col">
            <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                <div className="flex min-w-0 items-center gap-7">
                    <Comeback className="cursor-pointer text-lightMain" />
                    <span className="min-w-0 truncate text-xl font-bold text-lightMain">
                        <Trans>Transaction</Trans>
                    </span>
                </div>
                <WalletBaseMoreAction
                    icon={<MoreIcon width={24} height={24} className="text-main" />}
                    address={activity.owner as Address}
                    ens={activity.displayInfo?.ensHandle}
                />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link href={profileUrl}>
                        <Avatar
                            alt={activity.owner}
                            className="size-10 rounded-full"
                            src={
                                activity.displayInfo?.avatarUrl ??
                                getStampAvatarByProfileId(Source.Wallet, activity.owner)
                            }
                            size={40}
                        />
                    </Link>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-x-1 text-medium">
                            <Link href={profileUrl} className="min-w-0 truncate font-bold text-lightMain">
                                {activity.displayInfo?.ensHandle ? (
                                    <span>
                                        {activity.displayInfo.ensHandle.split('.')[0]}
                                        <span className="text-second">
                                            .{activity.displayInfo.ensHandle.split('.')[1]}
                                        </span>
                                    </span>
                                ) : (
                                    addressName
                                )}
                            </Link>
                        </div>
                        <div className="flex items-center gap-x-1 text-sm text-second">
                            {activity.displayInfo?.ensHandle ? (
                                <Link href={profileUrl} className="text-second">
                                    {addressName}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pb-3 pl-[68px] pr-4 pt-1">
                {activity.dex_name || activity.router_address ? (
                    <div className="mb-4 flex items-center gap-x-2">
                        <Trans>
                            <div className="flex items-center gap-x-1 rounded-lg border border-main px-2 text-main">
                                <ExchangeIcon className="size-3" />
                                <span className="text-medium leading-6">
                                    {isCrossChain ? <Trans>Bridged</Trans> : <Trans>Swapped</Trans>}
                                </span>
                            </div>
                            <span>on</span>
                            {activity.dex_logo ? (
                                <Image
                                    src={activity.dex_logo}
                                    alt={activity.dex_name}
                                    className="size-4 rounded-full"
                                    width={16}
                                    height={16}
                                />
                            ) : null}

                            <span className="text-[14px] font-semibold leading-[18px]">
                                {activity.dex_name || formatAddress(activity.router_address, 4)}
                            </span>
                        </Trans>
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    {activity.from_token?.symbol ? (
                        <div className="flex flex-col gap-2">
                            <Link
                                href={resolveTokenPageUrl({
                                    identity: activity.from_token.symbol,
                                    chainId: activity.chain_id,
                                    trader: activity.owner,
                                    traderName: activity.displayInfo?.ensHandle,
                                    address: activity.from_token.address,
                                })}
                                className="flex items-center gap-2 rounded-lg bg-bg p-3"
                            >
                                {activity.from_token.logo ? (
                                    <Image
                                        src={activity.from_token.logo}
                                        alt={activity.from_token.symbol}
                                        className="size-8 rounded-full"
                                        width={32}
                                        height={32}
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-second">
                                        {first(activity.from_token.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-medium leading-5 text-lightMain">
                                            {activity.from_token.name}
                                        </span>
                                        {activity.from_token.amount_num ? (
                                            <span className="text-base leading-5">
                                                - {renderShrankPrice(formatPrice(activity.from_token.amount_num) ?? '')}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-second">
                                        <span className="text-sm leading-[18px]">{activity.from_token.symbol}</span>
                                        <span className="text-sm leading-[18px]">
                                            {formatTokenUSD(activity.from_token.amount_usd)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ) : null}
                    {activity.to_token?.symbol ? (
                        <div>
                            <Link
                                href={resolveTokenPageUrl({
                                    identity: activity.to_token.symbol,
                                    chainId: activity.chain_id,
                                    trader: activity.owner,
                                    traderName: activity.displayInfo?.ensHandle,
                                    address: activity.to_token.address,
                                })}
                                className="flex items-center gap-2 rounded-lg bg-bg p-3"
                            >
                                {activity.to_token.logo ? (
                                    <Image
                                        src={activity.to_token.logo}
                                        alt={activity.to_token.symbol}
                                        className="size-8 rounded-full"
                                        width={32}
                                        height={32}
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-second">
                                        {first(activity.to_token.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-medium leading-5 text-lightMain">
                                            {activity.to_token.name}
                                        </span>
                                        {activity.to_token.amount_num ? (
                                            <span className="text-base leading-5 text-success">
                                                + {renderShrankPrice(formatPrice(activity.to_token.amount_num) ?? '')}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-second">
                                        <span className="text-sm leading-[18px]">{activity.to_token.symbol}</span>
                                        <span className="text-sm leading-[18px]">
                                            {formatTokenUSD(activity.to_token.amount_usd)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ) : null}

                    <SwapActions activity={activity} isDetail />
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-second">
                            <Trans>Contract</Trans>
                        </span>
                        <div className="flex items-center gap-1">
                            <AddressLink chainId={activity.chain_id} address={activity.router_address} />
                            {activity.dex_logo ? (
                                <Image
                                    src={activity.dex_logo}
                                    alt={activity.dex_name}
                                    className="size-4 rounded-full"
                                    width={16}
                                    height={16}
                                />
                            ) : null}
                        </div>
                    </div>
                    {explorerLink ? (
                        <div className="flex items-center justify-between text-sm text-highlight">
                            <span className="text-second">
                                <Trans>Transaction Hash</Trans>
                            </span>

                            <TxLink chainId={activity.chain_id} hash={activity.hash}>
                                <ExportIcon className="size-4" />
                            </TxLink>
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-second">
                            <Trans>Block</Trans>
                        </span>
                        <span className="text-lightMain">{activity.block_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-second">
                            <Trans>Status</Trans>
                        </span>
                        <span
                            className={classNames('flex items-center gap-2', {
                                'text-success': activity.tx_status === 'success',
                                'text-warn': activity.tx_status === 'pending',
                                'text-danger': activity.tx_status === 'failed',
                            })}
                        >
                            <div
                                className={classNames('size-2 rounded-full', {
                                    'bg-success': activity.tx_status === 'success',
                                    'bg-warn': activity.tx_status === 'pending',
                                    'bg-danger': activity.tx_status === 'failed',
                                })}
                            />
                            <Select
                                value={activity.tx_status}
                                _success="Success"
                                _failed="Failed"
                                _pending="Pending"
                                other="Failed"
                            />
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-second">
                            <Trans>Network</Trans>
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-lightMain">{activity.chain_id === 101 ? 'Solana' : chain?.name}</span>
                            <ChainIcon
                                chainId={activity.chain_id}
                                size={15}
                                networkType={activity.chain_id === 101 ? NetworkType.Solana : NetworkType.Ethereum}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-second">
                            <Trans>Time</Trans>
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-lightMain">
                                {dayjs(Number(activity.timestamp) * 1000).format('MMM DD, YYYY [at] hh:mm A')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
