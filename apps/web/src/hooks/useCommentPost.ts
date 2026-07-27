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
import type { MetadataAttribute } from '@/providers/lens/metadata/Base.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useHasJoinedChannel } from '@/store/useJoinedChannelStore.js';

/**
 * Reply-compose overrides merged into the reply's `openComposeModal` call.
 * Structurally the LPT-1 subset of `ComposeModalOpenProps` (defined inline here
 * because hooks must not import from `@/modals` — layer rule). Used by the Orb
 * comment cell to carry the replier's own LPT-1 position onto a reply.
 */
export interface CommentComposeOptions {
    lpt1Tags?: string[];
    lpt1Attributes?: MetadataAttribute[];
    lockThread?: boolean;
}

export function useCommentPost(post: Post, disabled = false, commentComposeOptions?: CommentComposeOptions) {
    const { source, author } = post;

    const myProfile = useCurrentProfile(source);
    const isLogin = !!myProfile?.profileId;
    const { following, followedBy } = author.viewerContext || {};

    const { data: canReply } = useQuery({
        // `canComment` is part of the key so the permission re-evaluates once the
        // detail fetch resolves the gate — the initial (SSR/session-less) post can
        // report `canComment: true` before the authenticated refetch flips it.
        queryKey: [
            'reply-permission',
            source,
            post.postId,
            myProfile?.profileId,
            following,
            followedBy,
            post.canComment,
        ],
        enabled: isLogin && !disabled,
        staleTime: STALE_TIMES.MINUTE_1,
        queryFn: () => canReplyToPost(post, myProfile),
    });

    // If the reply is club-gated and the user just joined that club, unblock it
    // reactively — the indexer-backed `canReply` still reports the old gate for
    // a while after the on-chain join (FW-7831).
    const replyClubJoined = useHasJoinedChannel(
        myProfile?.profileId,
        post.replyRestriction?.clubGated ? post.replyRestriction.clubAddress : undefined,
    );

    // Gate on the post's own `canComment` too, not just the async `canReply`:
    // the permission query can still be loading or stale when the user clicks,
    // and without this the quick-reply panel would open the composer for a post
    // whose gate is already resolved (FW-7785).
    const commentDisabled =
        disabled || ((canReply === false || (post.canComment === false && canReply !== true)) && !replyClubJoined);
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
                // Spread last so a caller (e.g. the Orb comment cell) can carry the
                // replier's own LPT-1 position / lockThread onto the reply. Defaults
                // to undefined for normal replies — the composer stays position-less.
                ...commentComposeOptions,
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
        } else if (disabledMessage?.message) {
            // Legacy tooltip rules (nobody, followers-only, etc.): same copy as
            // the detail quick-reply panel and the comment-icon hover hint.
            enqueueWarningMessage(disabledMessage.message);
        } else {
            enqueueErrorMessage(t`You cannot reply to @${author.handle} on ${resolveSourceName(source)}.`);
        }
    }, [
        isLogin,
        commentDisabled,
        source,
        post,
        author.handle,
        anonymousPostEnabled,
        disabledMessage,
        commentComposeOptions,
    ]);

    const buttonDisabled = !isLogin ? disabled : commentDisabled;

    // `toast` restrictions (X's API limit) keep the surface clickable so the
    // user can continue on X; every other restriction greys it out. Shared by
    // the comment icon and the detail quick-reply box so the two can't drift.
    const { message, type } = disabledMessage || {};
    const visuallyDisabled = buttonDisabled && (!message || type !== 'toast');

    return {
        buttonDisabled,
        message: disabledMessage,
        visuallyDisabled,
        onComment: handleClick,
    };
}
