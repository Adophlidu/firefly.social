'use client';

import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useState } from 'react';

import FollowIcon from '@/assets/follow-bold.svg';
import FollowedIcon from '@/assets/followed.svg';
import MutualFollowIcon from '@/assets/mutual-follow.svg';
import { ToggleMutedProfileButton } from '@/components/Actions/ToggleMutedProfileButton.js';
import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { BaseToggleFollowButton } from '@/components/Profile/BaseToggleFollowButton.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

enum State {
    Follow = 'Follow',
    Unfollow = 'Unfollow',
    Following = 'Following',
}

interface FollowButtonProps extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    variant?: 'text' | 'icon';
    hasMutedButton?: boolean;
    followButtonClassName?: string;
    followingButtonClassName?: string;
}

export const FollowButton = memo(function FollowButton({
    variant = 'text',
    profile,
    className,
    followButtonClassName = '',
    followingButtonClassName = '',
    hasMutedButton = true,
    ...rest
}: FollowButtonProps) {
    const isMedium = useIsMedium();
    const [hovering, setHovering] = useState(false);
    const isProfileMuted = useIsProfileMuted(
        profile.source,
        profile.profileId,
        profile.viewerContext?.blocking,
        hasMutedButton && profile.viewerContext?.blocking === undefined,
    );
    const { data: isMutedAll } = useQuery({
        queryKey: ['profile', 'mute-all', profile.source, resolveFireflyProfileId(profile)],
        queryFn() {
            return FireflyEndpointProvider.isProfileMutedAll(profile.source, profile.profileId);
        },
    });
    const muted = isMutedAll || isProfileMuted;

    const isFollowing = !!profile.viewerContext?.following;
    const isFollowedBy = !!profile.viewerContext?.followedBy;

    const buttonLabelRender = useCallback(
        (showSuperFollow: boolean, loading: boolean) => {
            if (loading) return <LoadingIcon size={16} />;
            if (variant === 'text') {
                if (isFollowing) return hovering && !loading ? t`Unfollow` : t`Following`;
                return showSuperFollow ? t`Super Follow` : isFollowedBy ? t`Follow Back` : t`Follow`;
            }
            if (isFollowing) return <FollowedIcon className="size-4 flex-shrink-0" />;
            if (isFollowedBy) return <MutualFollowIcon className="size-4 flex-shrink-0" />;
            return <FollowIcon className="size-4 flex-shrink-0" />;
        },
        [hovering, isFollowing, isFollowedBy, variant],
    );

    if (hasMutedButton && muted) {
        return (
            <ToggleMutedProfileButton
                variant={variant}
                muted={muted}
                profile={profile}
                className={classNames(className, 'rounded-lg px-5')}
                {...rest}
            />
        );
    }

    const variantClassName = {
        text: 'min-w-[112px] box-border px-5 whitespace-nowrap',
        icon: 'w-8 max-w-8',
    }[variant];
    const buttonState = isFollowing ? (hovering && isMedium ? State.Unfollow : State.Following) : State.Follow;

    return (
        <BaseToggleFollowButton
            profile={profile}
            className={classNames(
                'flex h-8 items-center justify-center rounded-lg text-medium font-semibold transition-all',
                variantClassName,
                className,
                {
                    'bg-main text-primaryBottom hover:opacity-80': buttonState === State.Follow,
                    'border border-current text-lightMain': buttonState === State.Following,
                    'border border-danger border-opacity-50 bg-danger bg-opacity-20 text-danger':
                        buttonState === State.Unfollow,
                    [followButtonClassName]: buttonState === State.Follow,
                    [followingButtonClassName]: buttonState === State.Following,
                },
            )}
            {...rest}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {buttonLabelRender}
        </BaseToggleFollowButton>
    );
});
