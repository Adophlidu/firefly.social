import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
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
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
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
    const { source, author, restrictions, mentions } = post;
    const count = post.stats?.comments ?? 0;

    const profile = useCurrentProfile(source);
    const isLogin = !!profile?.profileId;

    const { data: authorProfile = null } = useQuery({
        queryKey: ['profile', source, author.profileId],
        queryFn: async () => {
            const provider = resolveSocialMediaProvider(source);
            return provider.getProfileById(author.profileId);
        },
        enabled: !disabled && !('canComment' in post),
    });

    const commentDisabled = useMemo(() => {
        if (disabled) return true;
        if ('canComment' in post) return !post.canComment;
        if (restrictions) {
            if (isSameProfile(author, profile)) return false;
            let isDisabled = true;
            for (const restriction of restrictions) {
                switch (restriction) {
                    case RestrictionType.Nobody:
                        return !isSameProfile(profile, author);
                    case RestrictionType.Everyone:
                        return false;
                    case RestrictionType.MentionedProfiles:
                        if (mentions?.some((x) => isSameProfile(x, profile))) isDisabled = false;
                        break;
                    case RestrictionType.YouFollower:
                        if (authorProfile?.viewerContext?.following) isDisabled = false;
                        break;
                    case RestrictionType.OnlyPeopleYouFollow:
                        if (authorProfile?.viewerContext?.followedBy) isDisabled = false;
                        break;
                    default:
                        safeUnreachable(restriction);
                }
            }
            return isDisabled;
        }
        return false;
    }, [
        disabled,
        post,
        restrictions,
        profile,
        author,
        mentions,
        authorProfile?.viewerContext?.following,
        authorProfile?.viewerContext?.followedBy,
    ]);

    const buttonDisabled = !isLogin ? disabled : commentDisabled;

    const handleClick = useCallback(async () => {
        if (!isLogin) {
            LoginModalRef.open({ source });
            return;
        }
        if (!commentDisabled) {
            ComposeModalRef.open({
                type: 'reply',
                post,
                source,
            });
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, commentDisabled, source, post, author.handle]);

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
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Comment"
                    onClick={handleClick}
                >
                    <ReplyIcon width={16} height={16} />
                </motion.button>
            </Tooltip>
            {!hiddenCount && count ? <span className="text-xs font-medium text-main">{nFormatter(count)}</span> : null}
        </ClickableArea>
    );
});
