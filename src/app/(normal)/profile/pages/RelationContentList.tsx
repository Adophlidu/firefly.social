'use client';

import { safeUnreachable } from '@dimensiondev/utils';

import { FollowersList } from '@/app/(normal)/profile/pages/FollowersList.js';
import { FollowingList } from '@/app/(normal)/profile/pages/FollowingList.js';
import { MutualFollowersList } from '@/app/(normal)/profile/pages/MutualFollowersList.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { FollowCategory, type ProfileCategory } from '@/constants/enum.js';
import { ProfileRelationContext } from '@/hooks/useProfileRelationContext.js';

interface RelationContentListProps {
    category: ProfileCategory;
}

export function RelationContentList({ category }: RelationContentListProps) {
    const { profile } = ProfileRelationContext.useContainer();
    if (!profile) return <NoResultsFallback />;

    const followCategory = category as FollowCategory;
    switch (followCategory) {
        case FollowCategory.Following:
            return <FollowingList profileId={profile.profileId} source={profile.source} />;
        case FollowCategory.Followers:
            return <FollowersList profileId={profile.profileId} source={profile.source} />;
        case FollowCategory.Mutuals:
            return <MutualFollowersList profileId={profile.profileId} source={profile.source} />;
        default:
            safeUnreachable(followCategory);
            return <NoResultsFallback />;
    }
}
