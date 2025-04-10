'use client';

import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import FollowIcon from '@/assets/follow-bold.svg';
import FollowedIcon from '@/assets/followed.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { classNames } from '@/helpers/classNames.js';
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

    const buttonLabel = useMemo(() => {
        if (isMedium) {
            return data?.isMember ? t`Leave` : t`Join`;
        }

        return data?.isMember ? (
            <FollowedIcon className="size-4 flex-shrink-0" />
        ) : (
            <FollowIcon className="size-4 flex-shrink-0" />
        );
    }, [data?.isMember, isMedium]);

    if (isLoading) return null;
    if (!data || (!data.isMember && !data.canJoin && !data.canLeave)) return null;

    return (
        <ClickableButton
            onClick={() => mutation.mutate()}
            loading={isToggling}
            loadingSize={16}
            className={classNames(
                'h-8 bg-main text-primaryBottom',
                {
                    'rounded-lg px-5 text-medium font-bold leading-8': isMedium,
                    'flex w-8 max-w-8 items-center justify-center rounded-full': !isMedium,
                },
                className,
            )}
        >
            {buttonLabel}
        </ClickableButton>
    );
}
