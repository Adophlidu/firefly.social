import { Source } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { canReplyToPost } from '@/helpers/canReplyToPost.js';
import { enqueueErrorMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { openUrl } from '@/helpers/openUrl.js';
import { resolveMessageForCommentDisabled } from '@/helpers/resolveMessageForCommentDisabled.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { resolveXReplyUrl } from '@/helpers/resolveXReplyUrl.js';
import { useAnonymousPostAvailability } from '@/hooks/useAnonymousPostAvailability.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useCommentPost(post: Post, disabled = false) {
    const { source, author } = post;

    const myProfile = useCurrentProfile(source);
    const isLogin = !!myProfile?.profileId;
    const { following, followedBy } = author.viewerContext || {};

    const { data: canReply } = useQuery({
        queryKey: ['reply-permission', source, post.postId, myProfile?.profileId, following, followedBy],
        enabled: isLogin && !disabled,
        staleTime: STALE_TIMES.MINUTE_1,
        queryFn: () => canReplyToPost(post, myProfile),
    });

    const commentDisabled = disabled || canReply === false;
    const disabledMessage = commentDisabled ? resolveMessageForCommentDisabled(post) : null;

    const { canPost, sources } = useAnonymousPostAvailability();
    const anonymousPostEnabled = !isLogin && canPost && sources.includes(source);

    const handleClick = useCallback(async () => {
        if (!isLogin && !anonymousPostEnabled) {
            openLoginModalWithGuard({ source });
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
        } else if (source === Source.Twitter) {
            // X's API only allows replying to posts that mention you. The reply
            // icon renders a "Comment on X" menu (see CommentOnXMenu); reaching
            // here means the user opted into "always", so open X directly.
            openUrl(resolveXReplyUrl(post.postId));
        } else if (disabledMessage?.type === 'restricted') {
            // Lens rule gate (club membership, etc.): surface a clear hint with
            // an inline "Join now" action instead of a raw rule error.
            enqueueWarningMessage(disabledMessage.toastMessage ?? disabledMessage.message);
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [isLogin, commentDisabled, source, post, author.handle, anonymousPostEnabled, disabledMessage]);

    return {
        buttonDisabled: !isLogin ? disabled : commentDisabled,
        message: disabledMessage,
        onComment: handleClick,
    };
}
