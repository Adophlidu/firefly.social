/* cspell:disable */

'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import NumberFlow from '@number-flow/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import bs58 from 'bs58';
import dayjs from 'dayjs';
import { compact } from 'lodash-es';
import { useRouter } from 'next/navigation.js';
import { type HTMLProps, type MouseEventHandler, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useAsyncFn, useLocalStorage } from 'react-use';
import { useCountdown } from 'usehooks-ts';
import { type Address, encodeFunctionData, parseUnits, toHex } from 'viem';
import { useSwitchAccount } from 'wagmi';

import ArrowRightIcon from '@/assets/arrow-right.svg';
import TickSquareIcon from '@/assets/tick-square.svg';
import { Cashier } from '@/components/Activity/Cashier/index.js';
import { HaidilaoCodeDialog } from '@/components/Activity/HaidilaoCodeDialog.js';
import { usePureActivityBindAddress } from '@/components/Activity/hooks/useActivityBindAddress.js';
import { useActivityCompose } from '@/components/Activity/hooks/useActivityCompose.js';
import { useActivityConnectedAddresses } from '@/components/Activity/hooks/useActivityConnectedAddresses.js';
import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { useActivityConnectWallet } from '@/components/Activity/hooks/useActivityConnectWallet.js';
import { useActivityFollowProfile } from '@/components/Activity/hooks/useActivityFollowProfile.js';
import { useIsFollowInActivity } from '@/components/Activity/hooks/useIsFollowInActivity.js';
import { useIsLoginInActivity } from '@/components/Activity/hooks/useIsLoginInActivity.js';
import { useLoginInActivity } from '@/components/Activity/hooks/useLoginInActivity.js';
import { Link } from '@/components/Activity/Link.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { NetworkType, PageRoute, Source } from '@/constants/enum.js';
import { InvalidResultError } from '@/constants/error.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { FIREFLY_TWITTER_PROFILE } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { delay } from '@/helpers/delay.js';
import { enqueueErrorMessage, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { getErrorMessageFromError } from '@/helpers/getSnackbarMessageFromError.js';
import { getTokenAbiForWagmi } from '@/helpers/getTokenAbiForWagmi.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { retry } from '@/helpers/retry.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { unreachable } from '@/helpers/unreachable.js';
import { ConnectionSource, useWalletConnections } from '@/hooks/useWalletConnections.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { EthereumTransfer } from '@/providers/ethereum/Transfer.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import {
    CheckBuyStatus,
    type CheckPriceResponse,
    CommitOrderResponseStatus,
    OrderStatus,
    type TaskResponse,
    TaskStatus,
} from '@/providers/types/Activity.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';
import type { Token } from '@/providers/types/Transfer.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';
import { SupportedMethod } from '@/types/bridge.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

const TELEGRAM_URL = 'https://t.me/+OFx_HKqkeB01OGE1';
const COMPOSE_TEXT = `Join the Web3 Hotpot Festival with Firefly💜 — complete tasks, unlock Haidilao vouchers. Let’s dip in together🍲
https://firefly.social/event/haidilao`;

const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

interface TaskItemProps {
    title: React.ReactNode;
    primaryAction: React.ReactNode;
    secondaryAction?: React.ReactNode;
    onPrimaryClick?: MouseEventHandler;
    onSecondaryClick?: () => void;
    primaryHref?: string;
    completed?: boolean;
    started?: boolean;
}

interface ProductDetailRowProps {
    label: React.ReactNode;
    value: React.ReactNode;
}

interface LocalStorageItem {
    lastTask: TaskResponse['data'];
    lastCheckPrice: CheckPriceResponse['data'];
    lastNoticedAtMap?: Record<number, number>;
}

export function ActivityHaidilaoTask({ data }: { data: Required<ActivityInfoResponse>['data'] }) {
    const router = useRouter();
    const { data: task, refetch: refetchTask } = useQuery({
        queryKey: ['activity-tasks', data.name],
        queryFn: async () => {
            return FireflyActivityProvider.getTasks(data.name);
        },
    });

    const queryClient = useQueryClient();
    const refetchAll = async () => {
        await refetchTask();
        await queryClient.refetchQueries({ queryKey: ['activity-check-buy', data.name] });
        await queryClient.refetchQueries({ queryKey: ['activity-check-price', data.name] });
    };
    const completedTaskCount = task?.completed_count ?? 0;

    const [, bindAddress] = usePureActivityBindAddress();
    const compose = useActivityCompose();
    const isLogin = useIsLoginInActivity(Source.Twitter);
    const [, login] = useLoginInActivity();
    const [, follow] = useActivityFollowProfile(
        Source.Twitter,
        FIREFLY_TWITTER_PROFILE.platform_id,
        FIREFLY_TWITTER_PROFILE.handle,
    );
    const { data: isFollowing } = useIsFollowInActivity(
        Source.Twitter,
        FIREFLY_TWITTER_PROFILE.platform_id,
        FIREFLY_TWITTER_PROFILE.handle,
    );

    const followXTaskId = useMemo(() => task?.tasks.find((task) => task.name === 'follow-x')?.id, [task?.tasks]);

    useEffect(() => {
        if (isFollowing) {
            runInSafeAsync(async () => {
                if (followXTaskId) await FireflyActivityProvider.claimTask(data.name, followXTaskId);
            });
        }
    }, [data.name, isFollowing, followXTaskId]);

    const isStarted = dayjs(data.start_time).isBefore(dayjs());

    const tasks: TaskItemProps[] = compact(
        task?.tasks.map((task) => {
            const completed = task.status === TaskStatus.Completed;
            switch (task.name) {
                case 'follow-x':
                    const href = fireflyBridgeProvider.supported
                        ? `https://firefly.social/profile/x/${FIREFLY_TWITTER_PROFILE.handle}`
                        : resolveProfileUrl(Source.Twitter, FIREFLY_TWITTER_PROFILE.handle);
                    return {
                        title: completed ? (
                            <Trans>
                                Followed{' '}
                                <Link className="text-highlight" href={href} target="_blank">
                                    @thefireflyapp
                                </Link>{' '}
                                on X
                            </Trans>
                        ) : (
                            <Trans>
                                Follow{' '}
                                <Link className="text-highlight" href={href} target="_blank">
                                    @thefireflyapp
                                </Link>{' '}
                                on X
                            </Trans>
                        ),
                        primaryAction: <Trans>Follow</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        async onPrimaryClick() {
                            if (!isLogin) {
                                await login(Source.Twitter);
                                return;
                            }
                            await follow();
                            await FireflyActivityProvider.claimTask(data.name, task.id);
                            console.log(task);
                        },
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                case 'join-telegram':
                    return {
                        title: completed ? (
                            <Trans>Joined Firefly’s Telegram community</Trans>
                        ) : (
                            <Trans>Join Firefly&rsquo;s Telegram community</Trans>
                        ),
                        primaryAction: <Trans>Join</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        primaryHref: TELEGRAM_URL,
                        async onPrimaryClick() {
                            await delay(5000);
                            await FireflyActivityProvider.claimTask(data.name, task.id);
                        },
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                case 'repost-x-haidilao':
                    return {
                        title: completed ? (
                            <Trans>Reposted the official campaign post</Trans>
                        ) : (
                            <Trans>Repost the official campaign post</Trans>
                        ),
                        primaryAction: <Trans>Repost</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        primaryHref: fireflyBridgeProvider.supported
                            ? `https://firefly.social/post/x/1966010947853758872`
                            : resolvePostUrl(Source.Twitter, '1966010947853758872'),
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                case 'compose-haidilao':
                    return {
                        title: completed ? (
                            <Trans>Cross-posted to invite your crew to join</Trans>
                        ) : (
                            <Trans>Cross-post to invite your crew to join (Optional)</Trans>
                        ),
                        primaryAction: <Trans>Post</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        async onPrimaryClick() {
                            compose(COMPOSE_TEXT);
                            await delay(5000);
                            await FireflyActivityProvider.claimTask(data.name, task.id);
                        },
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                case 'bind-wallet':
                    return {
                        title: completed ? (
                            <Trans>Connected your wallet to Firefly</Trans>
                        ) : (
                            <Trans>Connect your wallet to Firefly (Optional)</Trans>
                        ),
                        primaryAction: <Trans>Connect</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        async onPrimaryClick() {
                            await bindAddress();
                        },
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                case 'bind-email':
                    return {
                        title: completed ? (
                            <Trans>Connected your email to Firefly</Trans>
                        ) : (
                            <Trans>Connect your email to Firefly (Optional)</Trans>
                        ),
                        primaryAction: <Trans>Connect</Trans>,
                        secondaryAction: <Trans>Refresh</Trans>,
                        async onPrimaryClick() {
                            if (fireflyBridgeProvider.supported) {
                                await fireflyBridgeProvider.request(SupportedMethod.LOGIN_OR_BIND_EMAIL, {});
                            } else {
                                router.push(PageRoute.SettingConnected);
                            }
                        },
                        async onSecondaryClick() {
                            await refetchAll();
                        },
                        completed,
                    };
                default:
                    return null;
            }
        }) ?? [],
    );

    return (
        <div className="flex flex-col gap-4 px-6 pb-4">
            <div className="space-y-8 text-sm text-main">
                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>About the Festival</Trans>
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <Trans>👀 Foodie builders, listen up!</Trans>
                        </li>
                        <li>
                            <Trans>
                                This October, join us at Haidilao Singapore for the first-ever Web3 Hotpot Festival — a
                                week of hotpot, networking, and fun.
                            </Trans>
                            <br />
                            <br />
                        </li>
                        <li>
                            <Trans>
                                📅 <span className="font-bold">Dates:</span> Sept 30 – Oct 6, 2025
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📍 <span className="font-bold">Locations:</span> Marina Bay Sands, Bugis+, Marina Square
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                🔥 <span className="font-bold">Unlock up to SGD50 Haidilao dining vouchers</span> by
                                completing Firefly social tasks (from just US$15 — or{' '}
                                <span className="font-bold">even free!</span>).
                            </Trans>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>Special On-Site Event</Trans>
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Trans>
                                As part of the festival, join us on-site at Marina Bay Sands Haidilao for an afternoon
                                of Web3 + lifestyle experiences:
                            </Trans>
                            <br />
                            <br />
                        </li>
                        <li>
                            <Trans>
                                📅 <span className="font-bold">Date/ Time:</span> Oct 1, 3:30–6:30 PM
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📍 <span className="font-bold">Location:</span> Marina Bay Sands
                            </Trans>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>What to Expect</Trans>
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Trans>
                                🎟 Complete more Firefly tasks to unlock{' '}
                                <span className="font-bold">free hotpot vouchers</span> or extra discount voucher
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                💺 <span className="font-bold">Exclusive seat booking</span> at Haidilao and additional
                                discounted dishes of your choice
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                🤝 Meet and connect with <span className="font-bold">Top 10 Asian Web3 teams</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📸 Snap photos and connect with <span className="font-bold">well-known KOLs</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                💅 Enjoy <span className="font-bold">a free manicure</span> session at our NFC Nail Art
                                booth brought to you together with Chipped
                            </Trans>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col border-t border-line pt-4">
                <h3 className="mb-4 text-lg font-bold text-main">
                    <Trans>Product Detail</Trans>
                </h3>
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: 'auto 1fr',
                    }}
                >
                    <ProductDetailRow label={<Trans>Product</Trans>} value={<Trans>Voucher SGD 50 x 1</Trans>} />
                    <ProductDetailRow label={<Trans>Period</Trans>} value={<Trans>Sept 30 – Oct 6</Trans>} />
                    <ProductDetailRow
                        label={<Trans>Rules</Trans>}
                        value={<Trans>1 voucher can be redeemed by 1 person; No limit for dining guests</Trans>}
                    />
                    <ProductDetailRow label={<Trans>Support</Trans>} value={<Trans>No refund</Trans>} />
                    <>
                        <div className="text-sm font-semibold text-main">
                            <Trans>Stores</Trans>
                        </div>
                        <Menu as="div" className="relative flex items-center">
                            <MenuButton className="flex items-center gap-0.5 transition-opacity hover:opacity-80">
                                <span className="text-sm text-main">
                                    <Trans>Valid at 3 Stores</Trans>
                                </span>
                                <ArrowRightIcon width={10} height={10} />
                            </MenuButton>
                            <MenuItems className="absolute left-0 z-10 mt-2 w-48 rounded-lg bg-primaryBottom py-3 text-main shadow-primary focus:outline-none">
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/775Lf22Gdwy4mszt6"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Marina Bay Sands</Trans>
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/CNCgARJEWbGtcYj48"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Bugis+</Trans>
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/5sxX9ETjmZhHk9VL8"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Marina Square</Trans>
                                    </a>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </>
                </div>

                <Image
                    width={1140}
                    height={450}
                    src="/image/activity/haidilao/product-detail.png"
                    alt="product-details"
                    className="mt-4 h-auto w-full"
                    style={{
                        aspectRatio: '1140 / 450',
                    }}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-line" />

            {/* Tasks Section */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-main">
                    <Trans>Completed tasks ({completedTaskCount}/3)</Trans>
                </h2>

                <div className="rounded-lg border border-success/20 bg-success/10 p-2">
                    <ul className="list-outside list-disc space-y-1 pl-4 text-xs leading-none text-success">
                        <li>
                            <Trans>
                                Complete the <span className="font-bold">3 basic tasks</span> below to activate your
                                voucher and get a S$50 Haidilao dining voucher{' '}
                                <span className="font-bold">for US$15</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                The more tasks you complete, the better your chances to unlock{' '}
                                <span className="font-bold">exclusive discounts</span> or even{' '}
                                <span className="font-bold">free hotpot vouchers</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>The final amount is subject to the actual order amount</Trans>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-4">
                    {tasks.map((task, index) => (
                        <TaskItem key={index} {...task} started={isStarted} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                className={classNames(
                    'sticky bottom-0 left-0 -mt-2 w-full bg-primaryBottom pt-2',
                    fireflyBridgeProvider.supported && IS_ANDROID ? 'pb-safe-or-8' : 'pb-safe-or-4',
                )}
            >
                {isStarted ? (
                    <ActivityHaidilaoTaskSubmitButton name={data.name} />
                ) : (
                    <button
                        className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                        disabled
                    >
                        <Trans>Upcoming</Trans>
                    </button>
                )}
            </div>
            <div className="-mt-4 w-full text-center text-[10px]">
                <Trans>
                    For any inquiries, please{' '}
                    <Link href={FIREFLY_TELEGRAM_URL} target="_blank" className="inline text-highlight">
                        contact us
                    </Link>
                    . All rights reserved by Firefly.
                </Trans>
            </div>
            <div
                className={classNames(
                    fireflyBridgeProvider.supported && IS_ANDROID ? 'pb-safe-or-8' : 'pb-safe-or-4 max-md:pb-safe-or-2',
                )}
            />
        </div>
    );
}

function ProductDetailRow({ label, value }: ProductDetailRowProps) {
    return (
        <>
            <div className="text-sm font-semibold text-main">{label}</div>
            <div className="text-sm text-main">{value}</div>
        </>
    );
}

function TaskItem({
    title,
    primaryAction,
    secondaryAction,
    onPrimaryClick,
    onSecondaryClick,
    primaryHref,
    completed,
    started = true,
}: TaskItemProps) {
    const isLogin = useIsLoginInActivity();
    const [, login] = useLoginInActivity();

    const [{ loading: primaryLoading }, handlePrimaryClick] = useAsyncFn(
        async (e: React.MouseEvent) => {
            if (!started) {
                enqueueSuccessMessage(<Trans>Activity not started yet</Trans>);
                return;
            }
            if (!isLogin) {
                await login(Source.Twitter);
                return;
            }
            return onPrimaryClick?.(e);
        },
        [started, isLogin, login, onPrimaryClick],
    );

    const [{ loading: secondaryLoading }, handleSecondaryClick] = useAsyncFn(async () => {
        if (!started) {
            enqueueSuccessMessage(<Trans>Activity not started yet</Trans>);
            return;
        }
        if (!isLogin) {
            await login(Source.Twitter);
            return;
        }
        return onSecondaryClick?.();
    }, [started, isLogin, login, onSecondaryClick]);

    const renderPrimaryButton = () => {
        const buttonClassName = classNames(
            'h-8 rounded-2xl bg-main px-4 text-xs font-bold leading-8 text-primaryBottom',
            primaryLoading ? 'cursor-not-allowed opacity-50' : '',
        );

        if (primaryHref) {
            return (
                <Link href={primaryHref} className={buttonClassName} onClick={handlePrimaryClick}>
                    {primaryAction}
                </Link>
            );
        }

        return (
            <ClickableButton onClick={handlePrimaryClick} className={buttonClassName} loading={primaryLoading}>
                {primaryAction}
            </ClickableButton>
        );
    };

    return (
        <div
            className={classNames(
                'flex min-h-14 items-center justify-between rounded-2xl p-3',
                completed ? 'bg-success/10 dark:bg-success/20' : 'bg-bg',
            )}
        >
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-main">{title}</span>
                </div>
                {!completed ? (
                    <div className="flex items-start gap-3">
                        {renderPrimaryButton()}
                        {secondaryAction ? (
                            <ClickableButton
                                onClick={handleSecondaryClick}
                                className={classNames(
                                    'h-8 rounded-2xl border border-current px-4 text-xs font-bold leading-8 text-main',
                                    secondaryLoading ? 'cursor-not-allowed opacity-50' : '',
                                )}
                                loading={secondaryLoading}
                            >
                                {secondaryAction}
                            </ClickableButton>
                        ) : null}
                    </div>
                ) : null}
            </div>
            {completed ? <TickSquareIcon className="size-6 shrink-0 text-success" /> : null}
        </div>
    );
}

function ActivityGoRedeemButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <HaidilaoCodeDialog open={open} onClose={() => setOpen(false)} />
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                onClick={() => {
                    setOpen(true);
                }}
            >
                <Trans>Check your redeem code</Trans>
            </button>
        </>
    );
}

const resolveOrderStatusText = createLookupTableResolver<OrderStatus, ReactNode>(
    {
        [OrderStatus.Unpaid]: <Trans>Unpaid</Trans>,
        [OrderStatus.Paying]: <Trans>Paying</Trans>,
        [OrderStatus.Completed]: <Trans>Completed</Trans>,
        [OrderStatus.Shipped]: <Trans>Shipped</Trans>,
        [OrderStatus.Cancelled]: <Trans>Cancelled</Trans>,
        [OrderStatus.Timeout]: <Trans>Timeout</Trans>,
        [OrderStatus.AmountError]: <Trans>AmountError</Trans>,
    },
    <Trans>Unknown</Trans>,
);

const resolveCommitOrderText = createLookupTableResolver<CommitOrderResponseStatus, ReactNode>(
    {
        [CommitOrderResponseStatus.Success]: <Trans>Success</Trans>,
        [CommitOrderResponseStatus.TaskNotMeet]: <Trans>The task Not Meet</Trans>,
        [CommitOrderResponseStatus.OutOfStock]: <Trans>Out of stock</Trans>,
        [CommitOrderResponseStatus.WrongPose]: <Trans>Wrong pose</Trans>,
        [CommitOrderResponseStatus.OrderExists]: <Trans>OrderExists</Trans>,
        [CommitOrderResponseStatus.SubmitException]: <Trans>Submit exception</Trans>,
        [CommitOrderResponseStatus.SystemBusy]: <Trans>System busy</Trans>,
    },
    <Trans>Unknown</Trans>,
);

function usePurchase(name: string, { onClose }: { onClose?: () => void }) {
    const connections = useWalletConnections();
    const { switchAccountAsync } = useSwitchAccount();
    const queryClient = useQueryClient();
    return useAsyncFn(
        async (address: string, networkType: NetworkType) => {
            try {
                const checkPrice = await queryClient.ensureQueryData({
                    queryKey: ['activity-check-price', name],
                    queryFn: () => FireflyActivityProvider.checkPrice(name),
                });
                if (!checkPrice) {
                    enqueueErrorMessage(<Trans>Sold Out.</Trans>);
                    return;
                }
                const orderCommitResponse = await FireflyActivityProvider.orderCommit(name, {
                    productId: checkPrice.product_id,
                });
                if (!orderCommitResponse.EvmWallet || !orderCommitResponse.SolanaWallet) {
                    enqueueErrorMessage(resolveCommitOrderText(orderCommitResponse.Status));
                    return;
                }
                if (checkPrice.price <= 0) {
                    enqueueSuccessMessage(<Trans>Purchase Completed</Trans>);
                    await queryClient.refetchQueries({ queryKey: ['activity-check-buy', name] });
                    return;
                }
                const tokens = await FireflyEndpointProvider.getMultiChainTokenList(
                    [address],
                    [SolanaChainId.Mainnet, EthereumChainId.Base],
                );
                const tokenAsset = tokens.find(
                    (token) =>
                        isSameAddress(token.tokenAddress, SOLANA_USDC) || isSameAddress(token.tokenAddress, BASE_USDC),
                );
                if (!tokenAsset) {
                    return enqueueErrorMessage(<Trans>Failed to purchase. Insufficient balance</Trans>);
                }
                const token = formatTokenFromFireflyTokenAsset(tokenAsset);
                if (fireflyBridgeProvider.supported) {
                    switch (networkType) {
                        case NetworkType.Ethereum: {
                            const data = encodeFunctionData({
                                abi: getTokenAbiForWagmi(token.chainId, token.id as Address),
                                functionName: 'transfer',
                                args: [
                                    orderCommitResponse.EvmWallet,
                                    parseUnits(`${checkPrice.price}`, token.decimals),
                                ],
                            });
                            await fireflyBridgeProvider.request(SupportedMethod.SEND_EVM_TRANSACTION, {
                                chainId: toHex(token.chainId),
                                transaction: {
                                    from: address as Address,
                                    to: token.id as Address,
                                    data,
                                    value: '0x0',
                                },
                            });
                            break;
                        }
                        case NetworkType.Solana: {
                            const tx = await SolanaTransfer.getSplTransferTransaction({
                                token: token as Token<SolanaChainId>,
                                amount: `${checkPrice.price}`,
                                to: orderCommitResponse.SolanaWallet,
                            });
                            await fireflyBridgeProvider.request(SupportedMethod.SEND_SOLANA_TRANSACTION, {
                                transaction: {
                                    from: address,
                                    to: orderCommitResponse.SolanaWallet,
                                    data: bs58.encode(tx.serialize()),
                                },
                            });
                            break;
                        }
                        default:
                            unreachable(networkType);
                    }
                } else {
                    const connection = connections.find((x) => isSameAddress(x.address, address));
                    switch (networkType) {
                        case NetworkType.Ethereum: {
                            if (connection?.connector) await switchAccountAsync({ connector: connection.connector });
                            await EthereumTransfer.transfer({
                                to: orderCommitResponse.EvmWallet,
                                token: token as Token<EthereumChainId, Address>,
                                amount: `${checkPrice.price}`,
                            });
                            break;
                        }
                        case NetworkType.Solana: {
                            if (connection?.namespace === 'solana') {
                                useSolanaActiveNetworkStore
                                    .getState()
                                    .setActiveNetwork(
                                        connection?.source === ConnectionSource.Privy
                                            ? SolanaNetworkType.Privy
                                            : SolanaNetworkType.Appkit,
                                    );
                            }
                            await SolanaTransfer.transfer({
                                to: orderCommitResponse.SolanaWallet,
                                token: token as Token<SolanaChainId>,
                                amount: `${checkPrice.price}`,
                            });
                            break;
                        }
                        default:
                            unreachable(networkType);
                    }
                }
                await FireflyActivityProvider.reportOrderPaid(name, orderCommitResponse.orderNo);
                await queryClient.refetchQueries({ queryKey: ['activity-check-buy', name] });
                const orderStatus = await retry(async () => {
                    const checkOrder = await FireflyActivityProvider.checkOrder(name, orderCommitResponse.orderNo);
                    if (
                        checkOrder.OrderStatus === OrderStatus.Paying ||
                        checkOrder.OrderStatus === OrderStatus.Shipped
                    ) {
                        throw new InvalidResultError();
                    }
                    return checkOrder.OrderStatus;
                });
                onClose?.();
                if (orderStatus === OrderStatus.Completed) {
                    await delay(5000);
                    enqueueSuccessMessage(<Trans>Purchase Completed</Trans>);
                    await queryClient.refetchQueries({ queryKey: ['activity-check-buy', name] });
                    return;
                }
                enqueueErrorMessage(<Trans>Failed to purchase. {resolveOrderStatusText(orderStatus)}</Trans>);
            } catch (error) {
                console.error(error);
                const reason = getErrorMessageFromError(error, <Trans>Failed to purchase.</Trans>);
                enqueueErrorMessage(reason);
                throw error;
            }
        },
        [connections, name, onClose, queryClient, switchAccountAsync],
    );
}

function PurchaseButton({
    price,
    name,
    className,
    isContinue = false,
    productId,
    disabled,
    ...props
}: { price: number; name: string; isContinue?: boolean; productId?: string } & Omit<
    HTMLProps<HTMLButtonElement>,
    'children' | 'type'
>) {
    const [openCashier, setOpenCashier] = useState(false);
    const { addresses } = useActivityConnectedAddresses();
    const connectWallet = useActivityConnectWallet();
    const [{ loading: purchasing }, onPurchase] = usePurchase(name, { onClose: () => setOpenCashier(false) });
    const queryClient = useQueryClient();

    const [{ loading }, onClick] = useAsyncFn(async () => {
        if (productId && price <= 0) {
            await FireflyActivityProvider.orderCommit(name, {
                productId,
            });
            await delay(5000);
            await queryClient.refetchQueries({ queryKey: ['activity-check-buy', name] });
            return;
        }
        setOpenCashier(true);
    }, [productId, price, name, queryClient]);

    if (!addresses.length) {
        return (
            <button
                {...props}
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom duration-300 disabled:opacity-60"
                onClick={() => {
                    if (fireflyBridgeProvider.supported) {
                        connectWallet();
                        return;
                    }
                    WalletConnectModalRef.open();
                }}
            >
                <Trans>Connect Wallet</Trans>
            </button>
        );
    }

    return (
        <>
            <Cashier open={openCashier} onClose={() => setOpenCashier(false)} price={price} onContinue={onPurchase} />
            <button
                {...props}
                disabled={loading || purchasing || disabled}
                className={classNames(
                    'leading-12 relative flex h-12 w-full items-center justify-center rounded-full text-center text-base font-bold duration-300 disabled:bg-main disabled:text-primaryBottom disabled:opacity-60',
                    !isContinue && price >= 15 ? 'bg-main text-primaryBottom' : 'bg-[#8155ed] text-white',
                    className,
                )}
                onClick={onClick}
            >
                {purchasing ? (
                    <LoadingIcon />
                ) : (
                    <>
                        {isContinue ? (
                            <Trans>Continue payment</Trans>
                        ) : (
                            <Trans>
                                Purchase at $<NumberFlow value={price} />
                            </Trans>
                        )}
                    </>
                )}
            </button>
        </>
    );
}

function ActivityHaidilaoTaskSubmitButton({ name }: { name: string }) {
    const { isLoading } = useActivityConnections();
    const isLoginFirefly = useIsLoginInActivity();
    const { data: checkBuy } = useQuery({
        queryKey: ['activity-check-buy', name],
        async queryFn() {
            return FireflyActivityProvider.checkBuy(name);
        },
        enabled: isLoginFirefly,
    });

    const {
        data: checkPrice,
        refetch: refetchCheckPrice,
        isLoading: isCheckingPrice,
    } = useQuery({
        queryKey: ['activity-check-price', name],
        async queryFn() {
            return FireflyActivityProvider.checkPrice(name);
        },
        enabled: isLoginFirefly,
    });

    const { data: task, isLoading: isLoadingTask } = useQuery({
        queryKey: ['activity-tasks', name],
        queryFn: async () => {
            return FireflyActivityProvider.getTasks(name);
        },
        enabled: isLoginFirefly,
    });

    const [localStorage, setLocalStorage] = useLocalStorage<LocalStorageItem | null>(`${name}-tasks`, null);
    useEffect(() => {
        if (!task || !checkPrice || !checkBuy) return;
        if (
            (!checkBuy.orderInfo.OrderStatus || checkBuy.orderInfo.OrderStatus !== OrderStatus.Unpaid) &&
            task.completed_count > 3 &&
            !localStorage?.lastNoticedAtMap?.[task.completed_count] &&
            task.total_inventory > 0
        ) {
            if (`${checkPrice.product_id}` === '81') {
                enqueueWarningMessage(
                    <Trans>No discount yet! Do more tasks if available to claim your next draw!</Trans>,
                );
            } else {
                enqueueSuccessMessage(<Trans>Discount won! Valid for 3 minutes，snatch it now!</Trans>);
            }
            setLocalStorage((x) => ({
                lastTask: task,
                lastCheckPrice: checkPrice,
                lastNoticedAtMap: {
                    ...x?.lastNoticedAtMap,
                    [task.completed_count]: Date.now(),
                },
            }));
        } else {
            setLocalStorage((x) => ({ ...x, lastTask: task, lastCheckPrice: checkPrice }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task, checkPrice, checkBuy]);

    const price = checkPrice?.price ?? 15;
    const completedTaskCount = task?.completed_count ?? 0;
    const canBuy = completedTaskCount >= 3;
    const isSoldOut = (task?.total_inventory ?? 0) <= 0;
    const [, login] = useLoginInActivity();

    if (checkBuy?.status === CheckBuyStatus.Purchased) {
        return <ActivityGoRedeemButton />;
    }

    if (checkBuy?.orderInfo.OrderStatus === OrderStatus.AmountError) {
        return (
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                disabled
            >
                <Trans>Amount exception</Trans>
            </button>
        );
    }

    if (isLoading || isCheckingPrice || isLoadingTask) {
        return (
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                disabled
            >
                <LoadingIcon />
            </button>
        );
    }

    if (!isLoginFirefly) {
        return (
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                onClick={() => login(Source.Twitter)}
                disabled={isLoading}
            >
                <Trans>Sign in</Trans>
            </button>
        );
    }

    if ((task && isSoldOut && checkBuy?.status !== CheckBuyStatus.PurchasedUnpaid) || !checkPrice) {
        return (
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                disabled
            >
                {task?.has_inprogress_order ? <Trans>Unpaid orders exist, retry later</Trans> : <Trans>Sold Out</Trans>}
            </button>
        );
    }

    return (
        <>
            {(checkPrice?.remainingLockSeconds ?? 0) > 0 ? (
                <Countdown countStart={checkPrice?.remainingLockSeconds ?? 0} onEnd={refetchCheckPrice} />
            ) : null}
            <PurchaseButton
                disabled={!canBuy}
                price={price}
                name={name}
                isContinue={checkBuy?.status === CheckBuyStatus.PurchasedUnpaid}
            />
        </>
    );
}

function Countdown({ countStart, onEnd }: { countStart: number; onEnd?: () => void }) {
    const [count, { startCountdown }] = useCountdown({
        countStart,
        intervalMs: 1000,
        countStop: 0,
        isIncrement: false,
    });
    const countRef = useRef(0);

    useEffect(() => {
        startCountdown();
    }, [startCountdown]);

    useEffect(() => {
        if (count === 0 && countRef.current !== 0) {
            onEnd?.();
        }
        countRef.current = count;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count]);

    if (count <= 0) return null;
    const formattedTime = `${Math.floor(count / 60)}:${String(count % 60).padStart(2, '0')}`;
    return (
        <div className="mb-2.5 h-6 text-center font-bold leading-6">
            <Trans>Discount ends in {formattedTime}</Trans>
        </div>
    );
}
