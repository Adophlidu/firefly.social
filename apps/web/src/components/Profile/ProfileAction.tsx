'use client';

import MessagesIcon from '@dimensiondev/assets/messages.svg';
import { PageRoute, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';

import { EditProfileButton } from '@/components/EditProfile/EditProfileButton.js';
import { Link } from '@/components/Link.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { ProfileLoginStatus } from '@/components/Profile/ProfileLoginStatus.js';
import { ProfileMoreAction, type ProfileMoreActionProps } from '@/components/Profile/ProfileMoreAction.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openDirectMessagePanel } from '@/controllers/openDirectMessagePanel.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useAuthenticatedDmAccount } from '@/hooks/useDmSession.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useRefreshedProfileInProfilePage } from '@/hooks/useRefreshedProfile.js';
import { isSameDmAccount } from '@/providers/orb/chat/isSameDmAccount.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileActionProps {
    profile: Profile;
    ProfileMoreActionProps?: Partial<ProfileMoreActionProps>;
}

export function ProfileAction({ profile: initialProfile, ProfileMoreActionProps }: ProfileActionProps) {
    const { profile, isRefreshing } = useRefreshedProfileInProfilePage(initialProfile);
    const profiles = useCurrentFireflyProfilesAll();
    const identity = resolveFireflyIdentity(profile);
    const isRelatedProfile = identity ? profiles.some((x) => isSameFireflyIdentity(x.identity, identity)) : false;
    const myProfile = useCurrentProfile(profile.source);
    const isEditableProfile = isSameProfile(myProfile, profile);
    const { authenticatedAccount } = useAuthenticatedDmAccount();
    const isCurrentDmAccount = isSameDmAccount(authenticatedAccount, profile.address);
    const isMedium = useIsMedium();

    const button = useMemo(() => {
        if (isEditableProfile)
            return <EditProfileButton className="z-1" profile={profile} variant={isMedium ? 'text' : 'icon'} />;
        const socialThemeClassName = classNames({
            '!bg-farcasterPrimary !text-white': profile.source === Source.Farcaster,
            '!bg-lensButton !text-primaryBottom': profile.source === Source.Lens,
            '!bg-bskyPrimary !text-white': profile.source === Source.Bsky,
            '!bg-main !text-primaryBottom': profile.source === Source.Twitter,
        });
        if (isRelatedProfile)
            return <ProfileLoginStatus profile={profile} className={classNames(socialThemeClassName, 'z-1')} />;
        if (isRefreshing) return null;

        return (
            <FollowButton
                profile={profile}
                variant={isMedium ? 'text' : 'icon'}
                autoQueryMuted={profile.source !== Source.Twitter}
                className="z-1 max-md:!w-[50px] max-md:!min-w-[50px] max-md:!max-w-[50px]"
                followButtonClassName={socialThemeClassName}
                followingButtonClassName={classNames({
                    '!text-farcasterPrimary': profile.source === Source.Farcaster,
                    '!text-lensButton': profile.source === Source.Lens,
                    '!text-bskyPrimary': profile.source === Source.Bsky,
                })}
            />
        );
    }, [isEditableProfile, isMedium, isRelatedProfile, profile, isRefreshing]);

    return (
        <>
            {button}
            {profile.source === Source.Lens &&
            profile.address &&
            !isEditableProfile &&
            !isRelatedProfile &&
            !isCurrentDmAccount ? (
                <Tooltip content={t`Message`} placement="top">
                    {isMedium ? (
                        <button
                            type="button"
                            aria-label={t`Message`}
                            className="grid size-8 place-items-center rounded-lg bg-primaryBottom text-lensButton dark:bg-white dark:bg-opacity-[0.08]"
                            onClick={() =>
                                openDirectMessagePanel({
                                    targetUserId: profile.address as string,
                                    name: profile.displayName || profile.handle,
                                    handle: profile.handle,
                                    avatarUrl: profile.pfp ?? undefined,
                                })
                            }
                        >
                            <MessagesIcon width={19} height={19} />
                        </button>
                    ) : (
                        <Link
                            href={`${PageRoute.Messages}?to=${encodeURIComponent(profile.address)}`}
                            aria-label={t`Message`}
                            className="grid size-8 place-items-center rounded-lg bg-primaryBottom text-lensButton dark:bg-white dark:bg-opacity-[0.08]"
                        >
                            <MessagesIcon width={19} height={19} />
                        </Link>
                    )}
                </Tooltip>
            ) : null}
            <ProfileMoreAction {...ProfileMoreActionProps} profile={profile} />
        </>
    );
}
