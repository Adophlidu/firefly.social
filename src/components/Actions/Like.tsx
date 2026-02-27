import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import { LikeButtonUI } from '@/components/Actions/LikeButtonUI.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
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
            <LikeButtonUI
                isLiked={!!hasLiked}
                disabled={disabled}
                likeCount={!hiddenCount ? post.stats?.reactions : undefined}
                className="inline-flex size-7 items-center justify-center rounded-full hover:bg-danger/[.20]"
            />
        </ClickableArea>
    );
});
