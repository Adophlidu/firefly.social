'use client';

import { useMemo } from 'react';

import { EditProfileButton } from '@/components/EditProfile/EditProfileButton.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { ProfileLoginStatus } from '@/components/Profile/ProfileLoginStatus.js';
import { ProfileMoreAction, type ProfileMoreActionProps } from '@/components/Profile/ProfileMoreAction.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useRefreshedProfileInProfilePage } from '@/hooks/useRefreshedProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileActionProps {
    profile: Profile;
    ProfileMoreActionProps?: Partial<ProfileMoreActionProps>;
}

export function ProfileAction({ profile: initialProfile, ProfileMoreActionProps }: ProfileActionProps) {
    const profile = useRefreshedProfileInProfilePage(initialProfile);
    const profiles = useCurrentFireflyProfilesAll();
    const identity = resolveFireflyIdentity(profile);
    const isRelatedProfile = identity ? profiles.some((x) => isSameFireflyIdentity(x.identity, identity)) : false;
    const myProfile = useCurrentProfile(profile.source);
    const isEditableProfile = isSameProfile(myProfile, profile);
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
        return (
            <FollowButton
                profile={profile}
                variant={isMedium ? 'text' : 'icon'}
                className="z-1 max-md:!w-[50px] max-md:!min-w-[50px] max-md:!max-w-[50px]"
                followButtonClassName={socialThemeClassName}
                followingButtonClassName={classNames({
                    '!text-farcasterPrimary': profile.source === Source.Farcaster,
                    '!text-lensButton': profile.source === Source.Lens,
                    '!text-bskyPrimary': profile.source === Source.Bsky,
                })}
            />
        );
    }, [isEditableProfile, isMedium, isRelatedProfile, profile]);

    return (
        <>
            {button}
            <ProfileMoreAction {...ProfileMoreActionProps} profile={profile} />
        </>
    );
}
