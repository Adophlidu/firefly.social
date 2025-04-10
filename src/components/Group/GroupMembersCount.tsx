'use client';

import { Plural } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

interface GroupMembersCountProps {
    groupId: string;
}

export function GroupMembersCount({ groupId }: GroupMembersCountProps) {
    const { data = 0, isLoading } = useQuery({
        queryKey: ['group', 'members-count', groupId],
        queryFn: async () => {
            return LensSocialMediaProvider.getGroupMembersCount(groupId);
        },
    });

    if (isLoading) return null;

    return (
        <>
            <span className="leading-[22px] text-secondary">·</span>
            <data value={data} className="flex items-center gap-1">
                <span className="text-lightMain">{nFormatter(data)}</span>
                <span className="text-secondary">
                    <Plural value={data} one="Member" other="Members" />
                </span>
            </data>
        </>
    );
}
