'use client';

import AddUser from '@dimensiondev/assets/add-user.svg';
import CloseSquareIcon from '@dimensiondev/assets/close-square.svg';
import Comment from '@dimensiondev/assets/comment-rp.svg';
import ETHIcon from '@dimensiondev/assets/eth-linear.svg';
import FarcasterIcon from '@dimensiondev/assets/farcaster-fill.svg';
import LensIcon from '@dimensiondev/assets/lens-fill.svg';
import Like from '@dimensiondev/assets/like.svg';
import LinkIcon from '@dimensiondev/assets/link-square.svg';
import LoadingIcon from '@dimensiondev/assets/loader2.svg';
import Repost from '@dimensiondev/assets/repost.svg';
import TickSquareIcon from '@dimensiondev/assets/tick-square.svg';
import { NetworkType, Source } from '@dimensiondev/enums';
import { classNames, getEnumAsArray } from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { sortBy } from 'lodash-es';
import { useMemo } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Link } from '@/components/Link.js';
import { Modal } from '@/components/Modal.js';
import { MentionLink } from '@/components/RedPacket/MentionLink.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveRedPacketPlatformType } from '@/helpers/resolveRedPacketPlatformType.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import type { ClaimStrategyStatus, PostReactionKind } from '@/providers/types/FireflyRedPacket.js';
import { StrategyType } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function ResultIcon({ result }: { result: boolean }) {
    return result ? (
        <TickSquareIcon className="text-success" width={24} height={24} />
    ) : (
        <CloseSquareIcon width={24} height={24} />
    );
}

const IconMap: Record<PostReactionKind, React.FunctionComponent<React.SVGAttributes<SVGElement>>> = {
    like: Like,
    repost: Repost,
    quote: Repost,
    comment: Comment,
    collect: Repost,
};

interface RequirementsModalProps {
    open: boolean;
    post: Post;
    claimStrategyStatus?: ClaimStrategyStatus[];
    showResults: boolean;
    isVerifying: boolean;
    isClaiming: boolean;
    onClose: () => void;
    onVerifyAndClaim: () => void;
}

export function RequirementsModal({
    open,
    post,
    showResults,
    claimStrategyStatus,
    isVerifying,
    isClaiming,
    onClose,
    onVerifyAndClaim,
}: RequirementsModalProps) {
    const TitleMap = {
        like: <Trans id="action-like">Like</Trans>,
        repost: <Trans>Repost</Trans>,
        quote: <Trans>Repost</Trans>,
        comment: <Trans>Comment</Trans>,
        collect: <Trans>Collect</Trans>,
    };

    const requirements = useMemo(() => {
        const orders = getEnumAsArray(StrategyType).map((x) => x.value);
        return sortBy(claimStrategyStatus, (x) => orders.indexOf(x.type as StrategyType));
    }, [claimStrategyStatus]);

    return (
        <Modal open={open} onClose={onClose}>
            <div
                className={classNames(
                    'group flex min-h-[344px] transform-gpu flex-col bg-primaryBottom transition-all max-md:h-screen max-md:w-screen md:min-w-[476px] md:rounded-xl',
                    {
                        unclaimed: showResults,
                    },
                )}
            >
                <div className="flex items-center justify-center gap-2 rounded-t-xl p-4">
                    <CloseButton
                        className="size-6 shrink-0"
                        onClick={() => {
                            onClose();
                        }}
                    />
                    <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">
                        <Trans>Requirements</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>
                <div className="flex flex-1 flex-col gap-2 rounded-b-xl bg-primaryBottom px-6 pb-4 pt-6">
                    {requirements.flatMap((status) => {
                        const platform = resolveRedPacketPlatformType(post.source);
                        if (status.type === StrategyType.profileFollow) {
                            const payloads = status.payload.filter((x) => x.platform === platform);

                            return (
                                <div
                                    className={classNames(
                                        'flex items-center gap-x-2.5 rounded-lg px-2 py-3 text-base leading-[18px]',
                                        !isVerifying && status.result
                                            ? 'group-[.unclaimed]:bg-success/10 dark:group-[.unclaimed]:bg-success/20'
                                            : 'group-[.unclaimed]:bg-bg',
                                    )}
                                    key={StrategyType.profileFollow}
                                >
                                    <AddUser width={16} height={16} />
                                    <span className="flex max-w-[352px] flex-1 items-center gap-1 truncate">
                                        <Trans>Follow</Trans>
                                        {payloads.map((x) => (
                                            <MentionLink key={x.profileId} {...x} />
                                        ))}
                                    </span>

                                    {showResults ? (
                                        isVerifying && !status.result ? (
                                            <LoadingIcon
                                                className="animate-spin text-secondary"
                                                width={24}
                                                height={24}
                                            />
                                        ) : (
                                            <ResultIcon result={status.result} />
                                        )
                                    ) : null}
                                </div>
                            );
                        }

                        if (status.type === StrategyType.postReaction && typeof status.result === 'object') {
                            const conditions = status.result.conditions.filter((x) => x.key !== 'collect');
                            const hasRepost = !!conditions.find(
                                (x) => (x.key === 'quote' || x.key === 'repost') && x.value,
                            );
                            const postId = status.payload.params?.find((x) => x.platform === platform)?.postId;
                            const postUrl = postId ? resolvePostUrl(post.source, postId) : null;
                            let hasRepostCondition = false;
                            return conditions
                                .reduce((arr: typeof conditions, condition) => {
                                    if (condition.key === 'quote' || condition.key === 'repost') {
                                        if (hasRepostCondition) return arr;
                                        hasRepostCondition = true;
                                        return [
                                            ...arr,
                                            { ...condition, key: 'repost', value: hasRepost },
                                        ] as typeof conditions;
                                    }
                                    return [...arr, condition];
                                }, [])
                                .map((condition) => {
                                    const Icon = IconMap[condition.key];

                                    return (
                                        <div
                                            className={classNames(
                                                'flex items-center gap-x-2.5 rounded-lg px-2 py-4 text-base leading-[18px]',
                                                !isVerifying && condition.value
                                                    ? 'group-[.unclaimed]:bg-success/10 dark:group-[.unclaimed]:bg-success/20'
                                                    : 'group-[.unclaimed]:bg-bg',
                                            )}
                                            key={condition.key}
                                        >
                                            <Icon width={16} height={16} />
                                            <span className="flex max-w-[352px] flex-1 items-center gap-1 truncate">
                                                {TitleMap[condition.key]}
                                                {postUrl ? (
                                                    <Link href={postUrl} className="text-main">
                                                        <LinkIcon width={16} height={16} />
                                                    </Link>
                                                ) : null}
                                            </span>
                                            {showResults ? (
                                                isVerifying && !condition.value ? (
                                                    <LoadingIcon
                                                        className="animate-spin text-secondary"
                                                        width={24}
                                                        height={24}
                                                    />
                                                ) : (
                                                    <ResultIcon result={condition.value} />
                                                )
                                            ) : null}
                                        </div>
                                    );
                                });
                        }

                        if (status.type === StrategyType.tokens) {
                            return (
                                <div
                                    className={classNames(
                                        'flex items-center gap-x-2.5 rounded-lg px-2 py-4 text-base leading-[18px]',
                                        !isVerifying && status.result.hasPassed
                                            ? 'group-[.unclaimed]:bg-success/10 dark:group-[.unclaimed]:bg-success/20'
                                            : 'group-[.unclaimed]:bg-bg',
                                    )}
                                    key={status.type}
                                >
                                    <ETHIcon width={16} height={16} />
                                    <div className="flex max-w-[352px] flex-1 flex-col gap-1">
                                        <div className="text-left text-base">
                                            <Trans>Token holder of any one below</Trans>
                                        </div>
                                        {status.payload.map((x) => {
                                            const tokenLink = resolveTokenPageUrl({
                                                identity: x.contractAddress,
                                                chainId: x.chainId,
                                            });
                                            return (
                                                <div
                                                    key={`${x.chainId}-${x.contractAddress}`}
                                                    className="flex items-center gap-1 truncate text-sm"
                                                >
                                                    <TokenIcon
                                                        className="shrink-0"
                                                        networkType={NetworkType.Ethereum}
                                                        chainId={+x.chainId}
                                                        icon={x.icon}
                                                        name={x.name}
                                                        size={18}
                                                        badgeSize={7.5}
                                                    />
                                                    {isZero(x.amount || 0) ? (
                                                        <Link className="ml-1 text-highlight" href={tokenLink}>
                                                            ${x.symbol}
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <Link className="ml-1 text-highlight" href={tokenLink}>
                                                                ${x.symbol}
                                                            </Link>
                                                            <TextOverflowTooltip
                                                                content={
                                                                    <Trans>
                                                                        no less than{' '}
                                                                        {formatBalance(x.amount, x.decimals)}
                                                                    </Trans>
                                                                }
                                                            >
                                                                <span className="truncate">
                                                                    <Trans>
                                                                        no less than{' '}
                                                                        {formatBalance(x.amount, x.decimals)}
                                                                    </Trans>
                                                                </span>
                                                            </TextOverflowTooltip>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {showResults ? (
                                        isVerifying && !status.result ? (
                                            <LoadingIcon
                                                className="animate-spin text-secondary"
                                                width={24}
                                                height={24}
                                            />
                                        ) : (
                                            <ResultIcon result={status.result.hasPassed} />
                                        )
                                    ) : null}
                                </div>
                            );
                        }
                        if (status.type === 'channel') {
                            if (post.source === Source.Farcaster && status.payload.farcasterChannelId) {
                                return (
                                    <div
                                        className={classNames(
                                            'flex items-center gap-x-2.5 rounded-lg px-2 py-4 text-base leading-[18px]',
                                            !isVerifying && status.result
                                                ? 'group-[.unclaimed]:bg-success/10 dark:group-[.unclaimed]:bg-success/20'
                                                : 'group-[.unclaimed]:bg-bg',
                                        )}
                                        key={status.type}
                                    >
                                        <FarcasterIcon width={16} height={16} />
                                        <div className="flex flex-1">
                                            <Trans>
                                                Member of{' '}
                                                <Link
                                                    href={`/club/farcaster/${status.payload.farcasterChannelId}`}
                                                    className="truncate text-highlight"
                                                    target="_blank"
                                                >
                                                    /{status.payload.farcasterChannelId}
                                                </Link>
                                            </Trans>
                                        </div>
                                        {showResults ? (
                                            isVerifying && !status.result ? (
                                                <LoadingIcon
                                                    className="animate-spin text-secondary"
                                                    width={24}
                                                    height={24}
                                                />
                                            ) : (
                                                <ResultIcon result={status.result} />
                                            )
                                        ) : null}
                                    </div>
                                );
                            } else if (post.source === Source.Lens && status.payload.lensOrbClubHandle) {
                                return (
                                    <div
                                        className={classNames(
                                            'flex items-center gap-x-2.5 rounded-lg px-2 py-4 text-base leading-[18px]',
                                            !isVerifying && status.result
                                                ? 'group-[.unclaimed]:bg-success/10 dark:group-[.unclaimed]:bg-success/20'
                                                : 'group-[.unclaimed]:bg-bg',
                                        )}
                                        key={status.type}
                                    >
                                        <LensIcon width={16} height={16} />
                                        <div className="flex flex-1">
                                            <Trans>
                                                Member of{' '}
                                                <Link
                                                    href={`/club/lens/${status.payload.lensOrbClubHandle}`}
                                                    className="truncate text-highlight"
                                                    target="_blank"
                                                >
                                                    /{status.payload.farcasterChannelId}
                                                </Link>
                                            </Trans>
                                        </div>
                                        {showResults ? (
                                            isVerifying && !status.result ? (
                                                <LoadingIcon
                                                    className="animate-spin text-secondary"
                                                    width={24}
                                                    height={24}
                                                />
                                            ) : (
                                                <ResultIcon result={status.result} />
                                            )
                                        ) : null}
                                    </div>
                                );
                            }
                        }

                        return null;
                    })}
                    <div className="grow" />
                    {showResults ? (
                        <ActionButton
                            className="w-full flex-none"
                            onClick={onVerifyAndClaim}
                            loading={isClaiming || isVerifying}
                            disabled={isVerifying}
                        >
                            <Trans>Verify and Claim</Trans>
                        </ActionButton>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
}
