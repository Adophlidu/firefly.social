import { RestrictionType, Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { resolveClubGatedMessage } from '@/helpers/resolveClubGatedMessage.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export interface CommentDisabledMessage {
    /** Message shown in the detail composer box and the hover tooltip. */
    message: ReactNode;
    /** Message shown in the timeline warning toast; falls back to `message`. */
    toastMessage?: ReactNode;
    /**
     * - `tooltip`: hover hint only (legacy reply restrictions).
     * - `toast`: X's API limitation, click opens the "Comment on X" flow.
     * - `restricted`: Lens rule gate — detail shows a box, timeline shows a toast.
     */
    type: 'tooltip' | 'toast' | 'restricted';
}

export function resolveMessageForCommentDisabled(post: Post): CommentDisabledMessage | null {
    const { source, restrictions, replyRestriction } = post;

    switch (source) {
        case Source.Twitter:
            return {
                message: (
                    <Trans>
                        Due to{' '}
                        <Link
                            target="_blank"
                            className="underline"
                            href="https://x.com/XDevelopers/status/2026084506822730185"
                        >
                            X's API limitations
                        </Link>
                        , you can only reply to posts that mention you.
                    </Trans>
                ),
                type: 'toast',
            };
        case Source.Lens:
        case Source.Bsky:
            // Club-gated reply: guide the user to join the club in place.
            if (replyRestriction?.clubGated && replyRestriction.clubAddress) {
                return {
                    message: resolveClubGatedMessage(replyRestriction.clubAddress),
                    type: 'restricted',
                };
            }
            if (restrictions?.includes(RestrictionType.Nobody)) {
                return {
                    message: <Trans>The author has disabled comments on this post.</Trans>,
                    type: 'tooltip',
                };
            }
            if (restrictions?.includes(RestrictionType.MentionedProfiles)) {
                return {
                    message: <Trans>Only mentioned profiles can comment on this post.</Trans>,
                    type: 'tooltip',
                };
            }
            if (restrictions?.includes(RestrictionType.YouFollower)) {
                return {
                    message: <Trans>Only followers of the author can comment on this post.</Trans>,
                    type: 'tooltip',
                };
            }
            if (restrictions?.includes(RestrictionType.OnlyPeopleYouFollow)) {
                return {
                    message: <Trans>Only people followed by the author can comment on this post.</Trans>,
                    type: 'tooltip',
                };
            }

            // Reply blocked by a rule we can't satisfy in place (token gate, etc.).
            if (post.canComment === false) {
                return {
                    message: <Trans>Requirements not met to reply.</Trans>,
                    toastMessage: <Trans>Replies are restricted for this post.</Trans>,
                    type: 'restricted',
                };
            }

            return null;
        case Source.Farcaster:
            return null;
        default:
            safeUnreachable(source);
            return null;
    }
}
