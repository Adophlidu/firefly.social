'use client';

import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { first, isUndefined } from 'lodash-es';
import { memo } from 'react';
import type { Address } from 'viem';

import ExchangeIcon from '@/assets/exchange.svg';
import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import { Avatar } from '@/components/Avatar.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { SwapButton } from '@/components/TokenProfile/SwapButton.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';
import { Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { resolveSwapPageUrl } from '@/helpers/resolveSwapPageUrl.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useChangeSwapLikeStatus } from '@/hooks/useChangeSwapLikeStatus.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import type { SwapActivity } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface SwapActivityItemProps {
    activity: SwapActivity;
    listKey?: string;
    index?: number;
}

export const SwapActivityItem = memo<SwapActivityItemProps>(function SwapActivityItem({ activity, listKey, index }) {
    const setScrollIndex = useGlobalState.use.setScrollIndex();
    const router = useRouter();
    const addressName = formatAddress(activity.owner, 4);
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: activity.owner });

    const { mutate: onLikeChange, isPending } = useChangeSwapLikeStatus(activity);

    const detailUrl = resolveSwapPageUrl(activity.hash, activity.chain_id);

    return (
        <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.toString().length !== 0) return;
                if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);

                if (detailUrl) {
                    captureSwapEvent(EventId.EVENT_SWAP_DETAIL_CLICK);
                    router.push(detailUrl);
                }
            }}
            onMouseEnter={() => {
                if (detailUrl) router.prefetch(detailUrl);
            }}
            className="flex cursor-pointer flex-col border-b border-line px-4 py-3"
        >
            {activity.followingSources?.length ? <FeedFollowSource source={first(activity.followingSources)} /> : null}
            <div className="flex gap-x-3">
                <div>
                    <Link href={profileUrl} onClick={stopPropagation}>
                        <Avatar
                            alt={activity.owner}
                            className="size-10 rounded-full"
                            src={
                                getWalletProfileAvatar(activity.displayInfo) ??
                                getStampAvatarByProfileId(Source.Wallet, activity.owner)
                            }
                            size={40}
                        />
                    </Link>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex max-w-full flex-1 items-center gap-x-1 text-medium text-second">
                            <Link
                                href={profileUrl}
                                className="min-w-0 max-w-full truncate font-bold text-lightMain"
                                onClick={stopPropagation}
                            >
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
                            {activity.displayInfo?.ensHandle ? (
                                <Link href={profileUrl} className="ml-2 max-md:hidden" onClick={stopPropagation}>
                                    {addressName}
                                </Link>
                            ) : null}
                            {activity.timestamp ? (
                                <span className="whitespace-nowrap pl-1">
                                    · <TimestampFormatter time={Number(activity.timestamp) * 1000} /> ·
                                </span>
                            ) : null}
                            <ChainIcon chainId={activity.chain_id} size={15} />
                        </div>

                        <ClickableArea>
                            <WalletBaseMoreAction
                                address={activity.owner as Address}
                                ens={activity.displayInfo?.ensHandle}
                            />
                        </ClickableArea>
                    </div>
                    {activity.dex_name || activity.router_address ? (
                        <div className="mb-2 flex items-center gap-x-2">
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
                    <ClickableArea className="flex flex-col gap-2">
                        {activity.from_token?.symbol ? (
                            <Link
                                href={resolveTokenPageUrl({
                                    identity: activity.from_token.symbol,
                                    chainId: activity.chain_id,
                                    trader: activity.owner,
                                    traderName: activity.displayInfo?.ensHandle,
                                    address: activity.from_token.address,
                                })}
                                className="flex items-center gap-2 rounded-lg bg-bg p-2"
                                onClick={stopPropagation}
                            >
                                {activity.from_token?.logo ? (
                                    <Image
                                        src={activity.from_token.logo}
                                        alt={activity.from_token.symbol}
                                        className="size-8 rounded-full"
                                        width={32}
                                        height={32}
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-second">
                                        {first(activity.from_token?.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-lightMain">
                                            {activity.from_token?.name}
                                        </span>
                                        {activity.from_token?.amount_num ? (
                                            <span>- {formatTokenAmount(activity.from_token?.amount_num)}</span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-second">
                                        <span className="text-xs text-second">{activity.from_token?.symbol}</span>
                                        <span>{formatTokenUSD(activity.from_token?.amount_usd)}</span>
                                    </div>
                                </div>
                            </Link>
                        ) : null}
                        {activity.to_token?.symbol ? (
                            <Link
                                href={resolveTokenPageUrl({
                                    identity: activity.to_token.symbol,
                                    chainId: activity.chain_id,
                                    trader: activity.owner,
                                    traderName: activity.displayInfo?.ensHandle,
                                    address: activity.to_token.address,
                                })}
                                className="flex items-center gap-2 rounded-lg bg-bg p-2"
                                onClick={stopPropagation}
                            >
                                {activity.to_token?.logo ? (
                                    <Image
                                        src={activity.to_token.logo}
                                        alt={activity.to_token.symbol}
                                        className="size-8 rounded-full"
                                        width={32}
                                        height={32}
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-bg text-second">
                                        {first(activity.to_token?.symbol)}
                                    </div>
                                )}
                                <div className="flex flex-1 flex-col">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-lightMain">
                                            {activity.to_token?.name}
                                        </span>
                                        {activity.to_token?.amount_num ? (
                                            <span className="text-success">
                                                + {formatTokenAmount(activity.to_token?.amount_num)}
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between text-second">
                                        <span className="text-xs text-second">{activity.to_token?.symbol}</span>
                                        <span>{formatTokenUSD(activity.to_token?.amount_usd)}</span>
                                    </div>
                                </div>
                            </Link>
                        ) : null}

                        <div className={classNames('mt-2 flex items-center justify-between gap-2')}>
                            <SwapButton
                                className="!ml-0 flex !px-2 py-[2px] !text-[12px] !font-medium !leading-[20px]"
                                tradable
                                swapProps={{
                                    chainId: activity.chain_id,
                                    fromToken: activity.from_token?.address,
                                    toToken: activity.to_token?.address,
                                }}
                            >
                                <Trans>Copy Trade</Trans>
                            </SwapButton>
                            <div className="flex items-center gap-1 text-sm text-second">
                                <ClickableButton
                                    className="cursor-pointer"
                                    loading={isPending}
                                    loadingSize={16}
                                    onClick={() => {
                                        onLikeChange();
                                    }}
                                >
                                    {activity.is_like ? (
                                        <LikedIcon className="size-4" />
                                    ) : (
                                        <LikeIcon className="size-4" />
                                    )}
                                </ClickableButton>
                                {activity.like_count > 0 ? <span>{nFormatter(activity.like_count)}</span> : null}
                            </div>
                        </div>
                    </ClickableArea>
                </div>
            </div>
        </motion.article>
    );
});
