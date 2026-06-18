'use client';

import ReplyIcon from '@dimensiondev/assets/reply.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { CommentOnXMenu } from '@/components/CommentOnXMenu.js';
import { Tooltip } from '@/components/Tooltip.js';
import { humanize, nFormatter } from '@/helpers/formatCommentCounts.js';
import { useCommentPost } from '@/hooks/useCommentPost.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

interface CommentProps {
    post: Post;
    disabled?: boolean;
    hiddenCount?: boolean;
}

export const Comment = memo<CommentProps>(function Comment({ post, disabled = false, hiddenCount = false }) {
    const count = post.stats?.comments ?? 0;

    const { buttonDisabled, message: disabledMessage, onComment } = useCommentPost(post, disabled);
    const { message, type } = disabledMessage || {};
    const commentDisabled = buttonDisabled && (!message || type !== 'toast');

    // A `toast` message means the reply is blocked by X's API but the click is
    // still actionable: offer to continue on X via a dropdown menu. Once the
    // user opts into "always", skip the menu and let the button open X directly.
    const { preferences } = usePreferencesState();
    const showCommentOnXMenu = type === 'toast' && !preferences.ALWAYS_COMMENT_ON_X;

    if (showCommentOnXMenu) {
        return (
            <ClickableArea className={classNames('flex w-min items-center space-x-1 md:space-x-2')}>
                <CommentOnXMenu post={post} count={count} />
                {!hiddenCount && count ? (
                    <span className="text-xs font-medium text-main">{nFormatter(count)}</span>
                ) : null}
            </ClickableArea>
        );
    }

    return (
        <ClickableArea className={classNames('flex w-min items-center space-x-1 md:space-x-2')}>
            <Tooltip
                placement="top"
                disabled={disabled}
                content={
                    message && type === 'tooltip' ? (
                        message
                    ) : count && count > 0 ? (
                        <Trans>{humanize(count)} Comments</Trans>
                    ) : (
                        <Trans>Comment</Trans>
                    )
                }
            >
                <motion.button
                    whileTap={commentDisabled ? {} : { scale: 0.9 }}
                    className={classNames(
                        'inline-flex size-7 items-center justify-center rounded-full text-second hover:bg-link/[0.2] hover:text-link focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        commentDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    )}
                    aria-label="Comment"
                    onClick={() => {
                        // `toast` (continue on X) and `restricted` (Lens rule gate
                        // → warning toast) are still actionable on click, so defer
                        // to onComment; other disabled states are inert.
                        if (buttonDisabled && type !== 'toast' && type !== 'restricted') return;
                        onComment();
                    }}
                >
                    <ReplyIcon width={16} height={16} />
                </motion.button>
            </Tooltip>
            {!hiddenCount && count ? <span className="text-xs font-medium text-main">{nFormatter(count)}</span> : null}
        </ClickableArea>
    );
});
