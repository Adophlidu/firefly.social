import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { canReplyToPost } from '@/helpers/canReplyToPost.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveMessageForCommentDisabled } from '@/helpers/resolveMessageForCommentDisabled.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAnonymousPostAvailability } from '@/hooks/useAnonymousPostAvailability.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type Post } from '@/providers/types/SocialMedia.js';

export function useCommentPost(post: Post, disabled = false) {
    const { source, author } = post;

    const myProfile = useCurrentProfile(source);
    const isLogin = !!myProfile?.profileId;
    const { following, followedBy } = author.viewerContext || {};

    const { data: canReply } = useQuery({
        queryKey: ['reply-permission', source, post.postId, myProfile?.profileId, following, followedBy],
        enabled: isLogin && !disabled,
        staleTime: STALE_TIMES.MINUTE_1,
        queryFn: () => canReplyToPost(post),
    });

    const commentDisabled = disabled || canReply === false;

    const { canPost, sources } = useAnonymousPostAvailability();
    const anonymousPostEnabled = !isLogin && canPost && sources.includes(source);

    const handleClick = useCallback(async () => {
        if (!isLogin && !anonymousPostEnabled) {
            openLoginModal({ source });
            return;
        }
        if (!commentDisabled) {
            openComposeModal({
                type: 'reply',
                post,
                source,
                channel: post.channel,
                isAnonymous: anonymousPostEnabled,
            });
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, commentDisabled, source, post, author.handle, anonymousPostEnabled]);

    return {
        buttonDisabled: !isLogin ? disabled : commentDisabled,
        message: commentDisabled ? resolveMessageForCommentDisabled(post) : null,
        onComment: handleClick,
    };
}
