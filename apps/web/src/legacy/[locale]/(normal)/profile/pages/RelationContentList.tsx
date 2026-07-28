'use client';

import type { ProfileCategory } from '@dimensiondev/enums';
import { FollowCategory } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { ProfileRelationContext } from '@/hooks/useProfileRelationContext.js';
import { FollowersList } from '@/legacy/[locale]/(normal)/profile/pages/FollowersList.js';
import { FollowingList } from '@/legacy/[locale]/(normal)/profile/pages/FollowingList.js';
import { MutualFollowersList } from '@/legacy/[locale]/(normal)/profile/pages/MutualFollowersList.js';

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
