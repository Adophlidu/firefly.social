'use client';

import ExchangeIcon from '@dimensiondev/assets/exchange.svg';
import ExportIcon from '@dimensiondev/assets/export.svg';
import MoreIcon from '@dimensiondev/assets/more-circle.svg';
import { classNames } from '@dimensiondev/utils';
import { Select, Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { first } from 'lodash-es';
import { memo } from 'react';
import { type Address } from 'viem';

import { AddressLink, TxLink } from '@/app/[locale]/(normal)/tx/[chain_id]/[hash]/components/TxLink.js';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { Comeback } from '@/components/Comeback.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { EnsName } from '@/components/Profile/EnsName.js';
import { SwapActions } from '@/components/Swap/SwapActions.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { chains } from '@/configs/chains.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getEnsNameFromDisplayInfo } from '@/helpers/getEnsNameFromDisplayInfo.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { getSwapActivityByHash } from '@/providers/firefly/endpoint/getSwapActivityByHash.js';

interface SwapDetailProps {
    chainId: number;
    hash: string;
}

export const SwapDetail = memo<SwapDetailProps>(function SwapDetail({ chainId, hash }) {
    const { data: activity, isLoading } = useQuery({
        queryKey: ['swap-detail', hash, chainId],
        queryFn: () => getSwapActivityByHash(hash, chainId),
        refetchInterval: (query) => {
            const data = query.state.data;
            // Stop refetching if owner exists or data is null
            if (!data || data.owner) return false;
            // Refetch every 2 seconds while owner is null
            return 2000;
        },
        retry: 10,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col">
                <div className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
                    <div className="flex min-w-0 items-center gap-7">
                        <Comeback className="cursor-pointer text-lightMain" />
                        <span className="min-w-0 truncate text-xl font-bold text-lightMain">
                            <Trans>Transaction</Trans>
                        </span>
                    </div>
                </div>
                <div className="p-4">
                    <div className="h-10 w-full animate-pulse rounded bg-bg" />
                </div>
            </div>
        );
    }

    if (!activity) {
        notFound();
    }

    const addressName = formatAddress(activity.owner ?? '', 4);
    const profileUrl = activity.owner ? getProfileUrl({ source: Source.Wallet, profileId: activity.owner }) : '';

    const chain = activity.chain_id !== 101 ? chains.find((x) => x.id === activity.chain_id) : null;
    const explorerLink =
        activity.chain_id !== 101
            ? resolveExplorerLink(activity.chain_id, activity.hash, 'tx')
            : `https://solscan.io/tx/${activity.hash}`;
    const ensHandle = getEnsNameFromDisplayInfo(activity, activity.owner);
    const txStatus = activity.tx_status.toLowerCase();
    const isFailed = txStatus === 'fail';

    const avatar = (
        <Avatar
            alt={activity.owner}
            className="size-10 shrink-0 rounded-full"
            src={
                activity.displayInfo?.avatarUrl ??
                (activity.owner ? getStampAvatarByProfileId(Source.Wallet, activity.owner) : '')
            }
            size={40}
        />
    );
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
                    ens={ensHandle}
                />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    {profileUrl ? <Link href={profileUrl}>{avatar}</Link> : avatar}
                    <div className="flex min-w-0 items-center gap-1">
                        <div className="flex min-w-0 items-center gap-x-1 text-medium">
                            <Link href={profileUrl} className="min-w-0 truncate font-bold text-lightMain">
                                {ensHandle ? <EnsName className="min-w-0 truncate" ens={ensHandle} /> : addressName}
                            </Link>
                        </div>
                        <div className="flex items-center gap-x-1 text-sm text-second">
                            {ensHandle ? (
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
                                    {activity.is_cross_chain ? <Trans>Bridged</Trans> : <Trans>Swapped</Trans>}
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
                                    traderName: ensHandle,
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
                                    traderName: ensHandle,
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

                    {!isFailed ? (
                        <NoSSR>
                            <SwapActions activity={activity} isDetail />
                        </NoSSR>
                    ) : null}
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
                        <div className="flex min-w-0 items-center justify-between gap-2 text-sm text-highlight">
                            <span className="shrink-0 text-second">
                                <Trans>Transaction Hash</Trans>
                            </span>

                            <TxLink chainId={activity.chain_id} hash={activity.hash}>
                                <ExportIcon className="size-4" />
                            </TxLink>
                        </div>
                    ) : null}
                    {!isFailed ? (
                        <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                            <span className="shrink-0 text-second">
                                <Trans>Block</Trans>
                            </span>
                            <span className="truncate text-lightMain">{activity.block_number}</span>
                        </div>
                    ) : null}
                    <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                        <span className="shrink-0 text-second">
                            <Trans>Status</Trans>
                        </span>
                        <span
                            className={classNames('flex items-center gap-2', {
                                'text-success': txStatus === 'success',
                                'text-warn': txStatus === 'pending',
                                'text-danger': txStatus === 'fail',
                            })}
                        >
                            <div
                                className={classNames('size-2 rounded-full', {
                                    'bg-success': txStatus === 'success',
                                    'bg-warn': txStatus === 'pending',
                                    'bg-danger': txStatus === 'fail',
                                })}
                            />
                            <Select
                                value={txStatus}
                                _success="Success"
                                _fail="Failed"
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
