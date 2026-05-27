'use client';

import PinnedIcon from '@dimensiondev/assets/pinned.svg';
import { SUPPORTED_PINNED_POST_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { pinnedPostQueryOptions } from '@/components/Posts/queries/pinnedPostQueryOptions.js';
import { SinglePost } from '@/components/Posts/SinglePost.js';

interface Props {
    source: SocialSource;
    profileId: string;
}

function PinnedPostContent({ source, profileId }: Props) {
    const { data } = useQuery(pinnedPostQueryOptions(source, profileId));

    if (!data) return null;

    return (
        <SinglePost
            className="z-10"
            header={
                <div className="mb-3 flex items-center text-medium font-bold text-second">
                    <PinnedIcon width={16} height={16} className="mr-2" />
                    <Trans>Pinned</Trans>
                </div>
            }
            post={data}
            showMore
        />
    );
}

export function PinnedPost(props: Props) {
    if (!SUPPORTED_PINNED_POST_SOURCES.includes(props.source)) return null;
    return <PinnedPostContent {...props} />;
}
