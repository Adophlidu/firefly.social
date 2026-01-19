import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { compact } from 'lodash-es';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import { polygon } from 'viem/chains';
import { useConnection } from 'wagmi';

import LinkIcon from '@/assets/link.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainGuardButton } from '@/components/ChainGuardButton.js';
import { Link } from '@/components/Link.js';
import { Source } from '@/constants/enum.js';
import { FetchError } from '@/constants/error.js';
import { LENS_CHAIN_ID } from '@/constants/static.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getTimeLeft } from '@/helpers/formatTimestamp.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useToggleFollow } from '@/hooks/useToggleFollow.js';
import { useTokenBalanceInPostCollect } from '@/hooks/useTokenBalanceInPostCollect.js';
import { actLensPost } from '@/providers/lens/actLensPost.js';
import { getWalletClientForLensChain } from '@/providers/lens/getWalletClientForLensChain.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { EVMExplorerResolver } from '@/web3-providers/evm/ResolverAPI.js';

function formatTimeLeft(endTime: string) {
    const timeLeft = getTimeLeft(endTime);
    if (!timeLeft) return;
    const { days, hours, minutes } = timeLeft;
    if (days >= 1) return <Trans>{days}d left</Trans>;
    if (hours >= 1) return <Trans>{hours}h left</Trans>;
    if (minutes >= 1) return <Trans>{minutes}m left</Trans>;
    return <Trans>1m left</Trans>;
}
function getCollectModuleData(collectModule: Post['collectModule']) {
    return {
        timeLeft: collectModule?.endsAt ? formatTimeLeft(collectModule?.endsAt) : undefined,
        isSoldOut: collectModule?.collectLimit ? collectModule?.collectedCount >= collectModule?.collectLimit : false,
        isTimeout: collectModule?.endsAt ? dayjs(collectModule?.endsAt).isBefore(dayjs()) : false,
    };
}

interface PostCollectProps {
    post: Post;
    onClose?: () => void;
}

export function PostCollect({ post, onClose }: PostCollectProps) {
    const account = useConnection();
    const currentProfile = useCurrentProfile(post.source);
    const [followLoading, toggleFollow] = useToggleFollow(post.author);

    const collectModule = post.collectModule;
    const { timeLeft, isSoldOut, isTimeout } = getCollectModuleData(collectModule);

    const isLogin = !!currentProfile?.profileId;
    const { data: profile = null, isLoading: queryProfileLoading } = useQuery({
        queryKey: ['profile', post.source, post.author.profileId, currentProfile?.profileId],
        enabled: collectModule?.followerOnly && isLogin,
        queryFn: async () => {
            return resolveSocialMediaProvider(post.source).getProfileByIdOrHandle(post.author.handle);
        },
        retry(failureCount, error) {
            if (error instanceof FetchError && error.status === 403) return false;
            return failureCount <= 3;
        },
    });

    const { balance, isLoading: queryBalanceLoading } = useTokenBalanceInPostCollect(
        post.source,
        collectModule?.assetAddress,
    );

    const freeToCollect = !collectModule?.amount;
    const hasEnoughBalance = collectModule?.amount ? (balance || 0) >= collectModule.amount : true;

    const [{ loading: collectLoading }, handleCollect] = useAsyncFn(async () => {
        try {
            if (!collectModule) return;

            const eventOptions = {
                collectWalletAddress: account.address,
                freeToCollect,
            };
            capturePostActionEvent('submit_collect', post, eventOptions);
            await actLensPost(post.postId);
            enqueueSuccessMessage(<Trans>Post collected successfully!</Trans>);
            capturePostActionEvent('collect', post, eventOptions);
            onClose?.();
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to collect post.</Trans>);
            throw error;
        }
    }, [collectModule, post, account.address, freeToCollect, onClose]);

    const action = useMemo(() => {
        const contractExploreUrl = collectModule?.contract.address
            ? (EVMExplorerResolver.addressLink(polygon.id, collectModule.contract.address) ?? '')
            : undefined;
        if (!isLogin) return <Trans>Login</Trans>;

        if (post.hasActed) {
            return (
                <>
                    <Trans>Collected</Trans>
                    {contractExploreUrl ? (
                        <Link className="ml-1" href={contractExploreUrl} target="_blank" rel="noreferrer noopener">
                            <LinkIcon width={18} height={18} />
                        </Link>
                    ) : null}
                </>
            );
        }

        if (isSoldOut)
            return (
                <>
                    <Trans>Sold Out</Trans>
                    {contractExploreUrl ? (
                        <Link className="ml-1" href={contractExploreUrl} target="_blank" rel="noreferrer noopener">
                            <LinkIcon width={18} height={18} />
                        </Link>
                    ) : null}
                </>
            );

        if (isTimeout)
            return (
                <>
                    <Trans>Time Out</Trans>
                    {contractExploreUrl ? (
                        <Link href={contractExploreUrl} target="_blank" rel="noreferrer noopener">
                            <LinkIcon width={18} height={18} />
                        </Link>
                    ) : null}
                </>
            );

        if (collectModule?.followerOnly && !profile?.viewerContext?.following) {
            return <Trans>Follow to Collect</Trans>;
        }

        if (!hasEnoughBalance) {
            return <Trans>Insufficient Balance</Trans>;
        }

        if (collectModule?.amount && collectModule.currency) {
            return (
                <Trans>
                    Collect for {collectModule.amount} {collectModule.currency}
                </Trans>
            );
        }

        return <Trans>Free Collect</Trans>;
    }, [
        collectModule?.contract.address,
        collectModule?.amount,
        collectModule?.currency,
        collectModule?.followerOnly,
        post.hasActed,
        isLogin,
        isSoldOut,
        isTimeout,
        hasEnoughBalance,
        profile?.viewerContext?.following,
    ]);

    const [{ loading: clickLoading }, handleClick] = useAsyncFn(async () => {
        if (!isLogin) {
            openLoginModal({ source: post.source });
            return;
        }

        if (post.source === Source.Lens) {
            await getWalletClientForLensChain();
        }

        if (collectModule?.followerOnly && !profile?.viewerContext?.following) {
            toggleFollow.mutate();

            return;
        }

        handleCollect();
    }, [isLogin, collectModule?.followerOnly, profile, handleCollect, post.source, toggleFollow]);

    const loading = followLoading || collectLoading || queryBalanceLoading || queryProfileLoading || clickLoading;

    const disabled = isLogin && (post.hasActed || isSoldOut || isTimeout || !hasEnoughBalance);

    return (
        <div className="overflow-x-hidden px-6 pb-6 max-md:px-0 max-md:pb-4">
            <div className="my-3 rounded-lg bg-lightBg px-3 py-2">
                <div className="flex items-center gap-2">
                    <Avatar src={post.author.pfp} size={20} alt={post.author.handle} />
                    <span className="overflow-hidden text-ellipsis text-medium font-bold leading-6 text-main">
                        {post.author.displayName}
                    </span>
                    <span className="text-medium leading-6 text-second">@{post.author.handle}</span>
                </div>
                <div className="line-clamp-2 text-left text-base leading-5 text-fourMain">
                    {post.metadata.content?.content}
                    {compact(
                        [
                            post.metadata.content?.attachments?.filter((x) => x.type === 'Image').length
                                ? '[Photo]'
                                : undefined,
                            post.metadata.content?.attachments?.filter((x) => x.type === 'Video').length
                                ? '[Video]'
                                : undefined,
                            post.metadata.content?.attachments?.filter((x) => x.type === 'Poll').length
                                ? '[Poll]'
                                : undefined,
                        ].join(''),
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-7 text-sm leading-[22px]">
                <div className="flex flex-col items-center">
                    <div className="font-bold text-main">
                        <span>{collectModule?.collectedCount}</span>
                        {collectModule?.collectLimit ? <span>/ {collectModule.collectLimit}</span> : null}
                    </div>
                    <div className="text-second">
                        <Trans>Collected</Trans>
                    </div>
                </div>

                {timeLeft && !isTimeout ? (
                    <div className="flex flex-col items-center">
                        <div className="font-bold text-main">{timeLeft}</div>
                        <div className="text-second">
                            <Trans>Time Limit</Trans>
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-col items-center">
                    <div className="font-bold text-main">
                        {collectModule?.followerOnly ? <Trans>Followers</Trans> : <Trans>Everyone</Trans>}
                    </div>
                    <div className="text-second">
                        <Trans>Exclusivity</Trans>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="font-bold text-main">
                        {collectModule?.amount && collectModule.currency ? (
                            `${collectModule.amount} $${collectModule.currency}`
                        ) : (
                            <Trans>Free</Trans>
                        )}
                    </div>
                    <div className="text-second">
                        <Trans>Cost</Trans>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex gap-2 max-md:mt-4">
                <ChainGuardButton
                    targetChainId={LENS_CHAIN_ID}
                    className="h-10 w-full"
                    loading={loading}
                    onlyLoading={queryBalanceLoading || queryProfileLoading}
                    disabled={disabled}
                    onClick={handleClick}
                >
                    {action}
                </ChainGuardButton>
            </div>
        </div>
    );
}
