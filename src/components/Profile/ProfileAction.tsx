'use client';

import { useQuery } from '@tanstack/react-query';
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
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileActionProps {
    profile: Profile;
    ProfileMoreActionProps?: Partial<ProfileMoreActionProps>;
}

export function ProfileAction({ profile: initialProfile, ProfileMoreActionProps }: ProfileActionProps) {
    const { data } = useQuery({
        queryKey: ['profile', initialProfile.source, initialProfile.profileId],
        queryFn: async () => {
            return resolveSocialMediaProvider(initialProfile.source).getProfileByIdOrHandle(initialProfile.profileId);
        },
    });

    const profile = data ?? initialProfile;

    const profiles = useCurrentFireflyProfilesAll();
    const identity = resolveFireflyIdentity(profile);
    const isRelatedProfile = identity
        ? profiles.some((x) => {
              return isSameFireflyIdentity(x.identity, identity);
          })
        : false;
    const myProfile = useCurrentProfile(profile.source);
    const isEditableProfile = isSameProfile(myProfile, profile);

    const isSmall = useIsSmall();

    const button = useMemo(() => {
        if (isEditableProfile) return <EditProfileButton profile={profile} variant={isSmall ? 'text' : 'icon'} />;
        const socialThemeClassName = classNames({
            '!bg-farcasterPrimary text-white': profile.source === Source.Farcaster,
            '!bg-lensButton text-mainLight': profile.source === Source.Lens,
            '!bg-bskyPrimary text-white': profile.source === Source.Bsky,
        });
        if (isRelatedProfile) return <ProfileLoginStatus profile={profile} className={socialThemeClassName} />;
        return (
            <FollowButton
                profile={profile}
                variant={isSmall ? 'text' : 'icon'}
                className={classNames(socialThemeClassName, {
                    '!w-[50px] !min-w-[50px] !max-w-[50px]': !isSmall,
                })}
            />
        );
    }, [isEditableProfile, isSmall, isRelatedProfile, profile]);

    return (
        <>
            {button}
            <ProfileMoreAction {...ProfileMoreActionProps} profile={profile} />
        </>
    );
}
