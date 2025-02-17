import { t } from '@lingui/core/macro';
import { motion } from 'framer-motion';
import { memo, useCallback, useMemo } from 'react';

import ReplyIcon from '@/assets/reply.svg';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Tooltip } from '@/components/Tooltip.js';
import { RestrictionType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { humanize, nFormatter } from '@/helpers/formatCommentCounts.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { ComposeModalRef, LoginModalRef } from '@/modals/controls.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface CommentProps {
    post: Post;
    disabled?: boolean;
    hiddenCount?: boolean;
}

export const Comment = memo<CommentProps>(function Comment({ post, disabled = false, hiddenCount = false }) {
    const { canComment, source, author, restrictions } = post;
    const count = post.stats?.comments ?? 0;

    const profile = useCurrentProfile(source);
    const isLogin = !!profile?.profileId;

    const commentDisabled = useMemo(
        () =>
            profile?.profileId && restrictions?.length && !disabled
                ? restrictions.some((x) => x === RestrictionType.Nobody) && !isSameProfile(profile, author)
                : disabled,
        [profile, restrictions, disabled, author],
    );

    const handleClick = useCallback(async () => {
        if (!isLogin) {
            LoginModalRef.open({ source });
            return;
        }
        if (canComment) {
            ComposeModalRef.open({
                type: 'reply',
                post,
                source,
            });
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, canComment, post, author.handle, source]);

    return (
        <ClickableArea
            className={classNames('flex w-min cursor-pointer items-center space-x-1 md:space-x-2', {
                'cursor-not-allowed opacity-50': commentDisabled,
            })}
            onClick={() => {
                if (!commentDisabled) handleClick();
            }}
        >
            <Tooltip
                disabled={commentDisabled}
                placement="top"
                content={count && count > 0 ? t`${humanize(count)} Comments` : t`Comment`}
            >
                <motion.button
                    disabled={commentDisabled}
                    whileTap={{ scale: 0.9 }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link focus:outline-none focus-visible:outline-none"
                    aria-label="Comment"
                >
                    <ReplyIcon width={16} height={16} />
                </motion.button>
            </Tooltip>
            {!hiddenCount && count ? <span className="text-xs font-medium text-main">{nFormatter(count)}</span> : null}
        </ClickableArea>
    );
});
