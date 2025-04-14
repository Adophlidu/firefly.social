import { t } from '@lingui/core/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import ReplyIcon from '@/assets/reply.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tooltip } from '@/components/Tooltip.js';
import { classNames } from '@/helpers/classNames.js';
import { humanize, nFormatter } from '@/helpers/formatCommentCounts.js';
import { useCommentPost } from '@/hooks/useCommentPost.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface CommentProps {
    post: Post;
    disabled?: boolean;
    hiddenCount?: boolean;
}

export const Comment = memo<CommentProps>(function Comment({ post, disabled = false, hiddenCount = false }) {
    const count = post.stats?.comments ?? 0;

    const { buttonDisabled, onComment } = useCommentPost(post, disabled);

    return (
        <ClickableArea className={classNames('flex w-min items-center space-x-1 md:space-x-2')}>
            <Tooltip
                disabled={buttonDisabled}
                placement="top"
                content={count && count > 0 ? t`${humanize(count)} Comments` : t`Comment`}
            >
                <motion.button
                    disabled={buttonDisabled}
                    whileTap={buttonDisabled ? {} : { scale: 0.9 }}
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-second hover:bg-link/[0.2] hover:text-link focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Comment"
                    onClick={onComment}
                >
                    <ReplyIcon width={16} height={16} />
                </motion.button>
            </Tooltip>
            {!hiddenCount && count ? <span className="text-xs font-medium text-main">{nFormatter(count)}</span> : null}
        </ClickableArea>
    );
});
