'use client';

import { Select, Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { first } from 'lodash-es';
import { memo } from 'react';

import ExchangeIcon from '@/assets/exchange.svg';
import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import LinkOut from '@/assets/link.svg';
import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { chains } from '@/configs/wagmiClient.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { resolveAddressLink } from '@/helpers/resolveExplorer.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useChangeSwapLikeStatus } from '@/hooks/useChangeSwapLikeStatus.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface SwapDetailProps {
    hash: string;
    chainId: number;
}

export const SwapDetail = memo<SwapDetailProps>(function SwapDetail({ hash, chainId }) {
    const { data: activity, isLoading } = useSuspenseQuery({
        queryKey: ['swap', hash, chainId],
        queryFn: async () => {
            const data = await FireflyEndpointProvider.getSwapActivityByHash(hash, chainId);
            return data;
        },
    });

    const addressName = formatAddress(activity?.owner ?? '', 4);
    const profileUrl = resolveProfileUrl(Source.Wallet, activity?.owner);

    const { mutate: onLikeChange, isPending } = useChangeSwapLikeStatus(activity);

    if (isLoading) {
        return <Loading />;
    }

    if (!activity) {
        notFound();
    }

    const explorerLink =
        activity.chain_id !== 101
            ? resolveExplorerLink(activity.chain_id, activity.hash, 'tx')
            : `https://solscan.io/tx/${activity.hash}`;

    const contractLink = resolveAddressLink(activity.chain_id, activity.router_address);

    const chain = activity.chain_id !== 101 ? chains.find((x) => x.id === activity.chain_id) : null;

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <Link href={profileUrl}>
                        <Avatar
                            alt={activity.owner}
                            className="size-10 rounded-full"
                            src={activity.displayInfo.avatarUrl}
                            size={40}
                        />
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-x-1 text-medium">
                            <Link href={profileUrl} className="min-w-0 truncate font-bold text-lightMain">
                                {activity.displayInfo.ensHandle ? (
                                    <span>
                                        {activity.displayInfo.ensHandle.split('.')[0]}
                                        <span className="text-lightSecond">
                                            .{activity.displayInfo.ensHandle.split('.')[1]}
                                        </span>
                                    </span>
                                ) : (
                                    addressName
                                )}
                            </Link>
                        </div>
                        <div className="flex items-center gap-x-1 text-sm text-lightSecond">
                            {activity.displayInfo.ensHandle ? (
                                <Link href={profileUrl} className="text-lightSecond">
                                    {addressName}
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3">
                {activity.dex_name || activity.router_address ? (
                    <div className="mb-4 flex items-center gap-x-2">
                        <div className="flex items-center gap-x-1 rounded-lg border border-main px-2 text-main">
                            <ExchangeIcon className="size-3" />
                            <span className="text-[15px] leading-6">
                                <Trans>Swapped</Trans>
                            </span>
                        </div>

                        <span>
                            <Trans>on</Trans>
                        </span>

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
                    </div>
                ) : null}

                <div className="flex flex-col gap-4">
                    {activity.from_token?.symbol ? (
                        <div className="flex flex-col gap-2">
                            <div className="text-lightSecond">
                                <Trans>Sent</Trans>
                            </div>
                            <Link
                                href={resolveTokenPageUrl(activity.from_token.symbol, activity.chain_id, true)}
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
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-lightSecond">
                                        {first(activity.from_token.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-lightMain">
                                            {activity.from_token.name}
                                        </span>
                                        {activity.from_token.amount_num ? (
                                            <span>- {formatTokenAmount(activity.from_token.amount_num)}</span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-lightSecond">
                                        <span className="text-xs">{activity.from_token.symbol}</span>
                                        <span>{formatTokenUSD(activity.from_token.amount_usd)}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ) : null}
                    {activity.to_token?.symbol ? (
                        <div>
                            <div className="text-lightSecond">
                                <Trans>Received</Trans>
                            </div>
                            <Link
                                href={resolveTokenPageUrl(activity.to_token.symbol, activity.chain_id, true)}
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
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-lightSecond">
                                        {first(activity.to_token.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-lightMain">
                                            {activity.to_token.name}
                                        </span>
                                        {activity.to_token.amount_num ? (
                                            <span className="text-success">
                                                + {formatTokenAmount(activity.to_token.amount_num)}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-lightSecond">
                                        <span className="text-xs">{activity.to_token.symbol}</span>
                                        <span>{formatTokenUSD(activity.to_token.amount_usd)}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ) : null}

                    <div className="mt-2 flex items-center justify-end">
                        <div className="flex items-center gap-1 text-sm text-lightSecond">
                            <ClickableButton
                                className="cursor-pointer"
                                loading={isPending}
                                loadingSize={16}
                                onClick={() => {
                                    onLikeChange();
                                }}
                            >
                                {activity.is_like ? <LikedIcon className="size-4" /> : <LikeIcon className="size-4" />}
                            </ClickableButton>
                            <span>{nFormatter(activity.like_count)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lightSecond">
                            <Trans>Contract</Trans>
                        </span>
                        <div className="flex items-center gap-1">
                            <Link href={contractLink ?? ''} className="text-highlight">
                                {formatAddress(activity.router_address, 4)}
                            </Link>
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
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-lightSecond">
                                <Trans>Transaction Hash</Trans>
                            </span>
                            <Link
                                href={explorerLink}
                                target="_blank"
                                className="flex items-center gap-1 text-highlight"
                            >
                                <span>{`${activity.hash.slice(0, 4)}...${activity.hash.slice(-4)}`}</span>
                                <LinkOut className="size-4" />
                            </Link>
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lightSecond">
                            <Trans>Block</Trans>
                        </span>
                        <span className="text-lightMain">{activity.block_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lightSecond">
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
                                className={classNames('h-1 w-1 rounded-full', {
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
                        <span className="text-lightSecond">
                            <Trans>Network</Trans>
                        </span>
                        <div className="flex items-center gap-1">
                            <ChainIcon
                                chainId={activity.chain_id}
                                size={15}
                                networkType={activity.chain_id === 101 ? NetworkType.Solana : NetworkType.Ethereum}
                            />
                            <span className="text-lightMain">{activity.chain_id === 101 ? 'Solana' : chain?.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-lightSecond">
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
