'use client';

import { safeUnreachable } from '@masknet/kit';
import { Suspense } from 'react';

import { GroupMemberList } from '@/components/Group/GroupMemberList.js';
import { GroupPostList } from '@/components/Group/GroupPostList.js';
import { Loading } from '@/components/Loading.js';
import { GroupTabType } from '@/constants/enum.js';
import { GroupPageContext } from '@/hooks/useGroupPageContext.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

function ContentList({ type, group }: { type: GroupTabType; group: ProfileGroup }) {
    switch (type) {
        case GroupTabType.Posts:
            return <GroupPostList group={group} />;
        case GroupTabType.Members:
            return <GroupMemberList group={group} />;
        default:
            safeUnreachable(type);
            return null;
    }
}

export function GroupContentList({ type }: { type: GroupTabType }) {
    const { group } = GroupPageContext.useContainer();

    if (!group) return null;

    return (
        <Suspense fallback={<Loading />}>
            <ContentList type={type} group={group} />
        </Suspense>
    );
}
