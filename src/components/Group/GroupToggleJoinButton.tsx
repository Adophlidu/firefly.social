'use client';

import { useQuery } from '@tanstack/react-query';

import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { ToggleJoinButton } from '@/components/ToggleJoinButton.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useToggleJoinGroup } from '@/hooks/useToggleJoinGroup.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupToggleJoinButtonProps extends ClickableButtonProps {
    group: ProfileGroup;
}

export function GroupToggleJoinButton({ group, className }: GroupToggleJoinButtonProps) {
    const isMedium = useIsMedium();
    const { data, isLoading } = useQuery({
        queryKey: ['group', group.source, group.id],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            return LensSocialMediaProvider.getGroupById(group.id);
        },
    });

    const [isToggling, mutation] = useToggleJoinGroup(data || group);

    if (isLoading) return null;
    if (!data || (!data.isMember && !data.canJoin && !data.canLeave)) return null;

    return (
        <ToggleJoinButton
            joined={!!data.isMember}
            onClick={() => mutation.mutate()}
            loading={isToggling}
            loadingSize={16}
            variant={isMedium ? 'text' : 'icon'}
            className={className}
        />
    );
}
