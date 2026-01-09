import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';

import LikeIcon from '@/assets/like.svg';
import LikedIcon from '@/assets/liked.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tooltip } from '@/components/Tooltip.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { capturePostActionEvent } from '@/providers/telemetry/capturePostActionEvent.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface LikeProps {
    post: Post;
    disabled?: boolean;
    isComment: boolean;
    hiddenCount?: boolean;
}

export const Like = memo<LikeProps>(function Like({ post, disabled = false, hiddenCount = false, isComment }) {
    const { author, postId, source, hasLiked } = post;

    const isLogin = useIsLogin(source);

    const handleClick = useCallback(async () => {
        if (!postId) return null;

        if (!isLogin) {
            openLoginModal({ source });
            return;
        }

        try {
            const provider = resolveSocialMediaProvider(source);

            if (hasLiked) {
                await provider.unvotePost(postId, Number(author.profileId));
            } else {
                await provider.upvotePost(postId, Number(author.profileId));
            }

            capturePostActionEvent(hasLiked ? 'unlike' : 'like', post);
            return;
        } catch (error) {
            if (isComment) {
                enqueueMessageFromError(
                    error,
                    hasLiked ? (
                        <Trans>Failed to unlike the comment.</Trans>
                    ) : (
                        <Trans>Failed to like the comment.</Trans>
                    ),
                );
            } else {
                enqueueMessageFromError(
                    error,
                    hasLiked ? <Trans>Failed to unlike the post.</Trans> : <Trans>Failed to like the post.</Trans>,
                );
            }
            throw error;
        }
    }, [postId, source, hasLiked, isLogin, author.profileId, post, isComment]);

    return (
        <ClickableArea
            className={classNames('flex w-min cursor-pointer items-center text-second hover:text-danger md:space-x-2', {
                'font-bold text-danger': !!hasLiked,
                'opacity-50': disabled,
            })}
            onClick={() => {
                if (disabled) return;
                handleClick();
            }}
        >
            <Tooltip
                content={hasLiked ? <Trans>Unlike</Trans> : <Trans>Like</Trans>}
                placement="top"
                disabled={disabled}
            >
                <motion.button
                    disabled={disabled}
                    whileTap={{ scale: 0.9 }}
                    className="inline-flex size-7 items-center justify-center rounded-full hover:bg-danger/[.20]"
                >
                    {hasLiked ? <LikedIcon width={16} height={16} /> : <LikeIcon width={16} height={16} />}
                </motion.button>
            </Tooltip>
            {!hiddenCount && post.stats?.reactions ? (
                <span
                    className={classNames('text-xs', {
                        'font-bold text-danger': !!hasLiked,
                    })}
                >
                    {nFormatter(post.stats?.reactions)}
                </span>
            ) : null}
        </ClickableArea>
    );
});
