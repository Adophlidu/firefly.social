import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { RestrictionType } from '@/constants/enum.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function resolveMessageForCommentDisabled(post: Post): {
    message: ReactNode;
    type: 'tooltip' | 'toast';
} | null {
    const { source, restrictions } = post;

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

            return null;
        case Source.Farcaster:
            return null;
        default:
            safeUnreachable(source);
            return null;
    }
}
