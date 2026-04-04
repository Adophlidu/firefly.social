'use client';

import { classNames } from '@dimensiondev/utils';
import { Plural } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';

import { Link } from '@/components/Link.js';
import { FollowCategory, Source } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface FollowersLinkProps extends HTMLProps<HTMLAnchorElement> {
    profile: Profile;
}

export const FollowersLink = memo<FollowersLinkProps>(function FollowersLink({ profile, className }) {
    const followerCount = profile.followerCount;

    return (
        <Link
            href={getProfileUrl(profile, FollowCategory.Followers)}
            prefetch={false}
            className={classNames('gap-1 hover:underline', className, {
                'pointer-events-none': profile.source !== Source.Farcaster && profile.source !== Source.Lens,
            })}
        >
            <data value={followerCount}>
                <span className="text-lightMain font-bold">{nFormatter(followerCount)} </span>
                <span className="text-secondary">
                    <Plural value={followerCount} one="Follower" other="Followers" />
                </span>
            </data>
        </Link>
    );
});
