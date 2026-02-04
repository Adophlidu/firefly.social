'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useState } from 'react';

import FollowIcon from '@/assets/follow-bold.svg';
import FollowedIcon from '@/assets/followed.svg';
import MutualFollowIcon from '@/assets/mutual-follow.svg';
import { ToggleMutedProfileButton } from '@/components/Actions/ToggleMutedProfileButton.js';
import { TwitterFollowButton } from '@/components/Actions/TwitterFollowButton.js';
import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ToggleFollowButton } from '@/components/Profile/ToggleFollowButton.js';
import { Source } from '@/constants/enum.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

enum State {
    Follow = 'Follow',
    Unfollow = 'Unfollow',
    Following = 'Following',
    FollowPending = 'FollowPending',
}

interface FollowButtonProps extends Omit<ClickableButtonProps, 'children'> {
    profile: Profile;
    variant?: 'text' | 'icon';
    hasMutedButton?: boolean;
    followButtonClassName?: string;
    followingButtonClassName?: string;
    autoQueryMuted?: boolean;
}

export const FollowButton = memo(function FollowButton({
    variant = 'text',
    profile,
    className,
    followButtonClassName = '',
    followingButtonClassName = '',
    hasMutedButton = true,
    autoQueryMuted = true,
    ...rest
}: FollowButtonProps) {
    const isMedium = useIsMedium();
    const [hovering, setHovering] = useState(false);
    const muted = useIsProfileMuted(
        profile.source,
        profile.profileId,
        profile.viewerContext?.blocking,
        hasMutedButton && profile.viewerContext?.blocking === undefined && autoQueryMuted,
    );

    const isFollowing = !!profile.viewerContext?.following;
    const isFollowedBy = !!profile.viewerContext?.followedBy;
    const isPending = !!profile.viewerContext?.followPending;

    const buttonLabelRender = useCallback(
        (showSuperFollow: boolean, loading: boolean) => {
            if (loading) return <LoadingIcon size={16} />;
            if (variant === 'text') {
                if (isFollowing) return hovering && !loading ? <Trans>Unfollow</Trans> : <Trans>Following</Trans>;
                return showSuperFollow ? (
                    <Trans>Super Follow</Trans>
                ) : isFollowedBy ? (
                    <Trans>Follow Back</Trans>
                ) : (
                    <Trans>Follow</Trans>
                );
            }
            if (isFollowing) return <FollowedIcon className="size-4 shrink-0" />;
            if (isFollowedBy) return <MutualFollowIcon className="size-4 shrink-0" />;
            return <FollowIcon className="size-4 shrink-0" />;
        },
        [hovering, isFollowing, isFollowedBy, variant],
    );
    if (
        profile.source === Source.Twitter &&
        (profile.viewerContext?.fullBlocking || profile.viewerContext?.followPending)
    ) {
        return (
            <TwitterFollowButton
                isBlocked={profile.viewerContext?.fullBlocking}
                isPending={profile.viewerContext?.followPending}
                variant={variant}
                className={classNames(className, 'rounded-lg px-5')}
                {...rest}
            />
        );
    }

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

    const buttonState = isPending
        ? State.FollowPending
        : isFollowing
          ? hovering && isMedium
              ? State.Unfollow
              : State.Following
          : State.Follow;

    return (
        <ToggleFollowButton
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
                    'border border-opacity-50 bg-opacity-20 text-main': buttonState === State.FollowPending,
                },
            )}
            {...rest}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {buttonLabelRender}
        </ToggleFollowButton>
    );
});
