'use client';

import { Source } from '@dimensiondev/enums';
import WarnIcon from '@dimensiondev/assets/warning-circle.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import type { PostBodyContentProps } from '@/components/Posts/PostBodyContent.js';

import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { Post } from '@/providers/types/SocialMedia.js';

const ModerationDescription = memo(function ModerationDescription({ post }: { post: Post }) {
    if (post.moderationReasons?.some((reason) => ['porn', 'sexual', 'nudity'].includes(reason))) {
        return <Trans>Adult content</Trans>;
    }
    return <Trans>Content is not suitable for all audiences</Trans>;
});

export const PostBodyModeration = memo(function PostBodyModeration(props: PostBodyContentProps) {
    const { post, isDetail, disablePadding } = props;

    const isMedium = useIsMedium('max');
    const noLeftPadding = isDetail || isMedium || disablePadding;

    return (
        <div
            className={classNames({
                'pl-[52px]': !noLeftPadding,
            })}
        >
            <div className="border-line bg-bg mt-4 flex items-center gap-2 rounded-lg border p-3">
                <WarnIcon width={24} height={24} className="shrink-0" />
                <p className="text-left text-[13px] font-medium leading-5">
                    <ModerationDescription post={post} />
                </p>
            </div>
            {post.moderator && post.source === Source.Bsky ? (
                <div className="text-secondary mt-2 text-[13px] font-medium leading-5">
                    <Trans>
                        Labeled by{' '}
                        {
                            <Link
                                className="text-highlight truncate hover:underline"
                                href={getProfileUrl(post.moderator)}
                            >
                                {post.moderator?.displayName}
                            </Link>
                        }
                        .
                    </Trans>
                </div>
            ) : null}
        </div>
    );
});
