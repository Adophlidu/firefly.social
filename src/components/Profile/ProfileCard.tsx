'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { FollowersLink } from '@/components/Profile/FollowersLink.js';
import { ProfileVerifyBadge } from '@/components/ProfileVerifyBadge/index.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { FollowCategory, Source } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type FireflyIdentity } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface ProfileCardProps {
    identity: FireflyIdentity;
    defaultProfile?: Profile;
}

export const ProfileCard = memo<ProfileCardProps>(function ProfileCard({ identity, defaultProfile }) {
    const { id, source } = identity;

    const myProfile = useCurrentProfile(narrowToSocialSource(source));
    const queryKey = [Source.Lens, Source.Twitter, Source.Bsky].includes(source)
        ? ['profile', source, id, 'tippy']
        : ['profile', source, id];
    const { data: profile, isLoading } = useQuery({
        queryKey,
        staleTime: STALE_TIMES.MINUTE_10,

        queryFn: async () => {
            if (!id || !source) return;
            const provider = resolveSocialMediaProvider(narrowToSocialSource(source));
            return provider.getProfileByIdOrHandle(id, true);
        },
        initialData: defaultProfile,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    if (isLoading) {
        return (
            <div className="h-[182px] w-[350px] rounded-2xl border border-secondaryLine bg-primaryBottom p-4">
                <div className="animate-pulse">
                    <div className="flex w-full gap-2.5">
                        <div className="size-20 rounded-full bg-third" />
                        <div className="flex flex-1 flex-col justify-between">
                            <div className="h-3 w-[120px] rounded bg-third" />
                            <div className="h-3 w-[120px] rounded bg-third" />
                            <div className="h-3 w-[120px] rounded bg-third" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-4">
                        <div className="h-3 w-full rounded bg-third" />
                        <div className="h-3 w-full rounded bg-third" />
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const url = getProfileUrl(profile);

    return (
        <ClickableArea className="flex w-[350px] flex-col gap-y-3 rounded-2xl border border-secondaryLine bg-primaryBottom p-4">
            <div className="flex gap-2.5">
                <Link href={url}>
                    <Avatar
                        src={profile.pfp || getStampAvatarByProfileId(profile.source, profile.profileId)}
                        alt="avatar"
                        size={80}
                        className="size-20 cursor-pointer rounded-full"
                    />
                </Link>
                <div className="flex min-w-0 flex-1 grow flex-col gap-[6px]">
                    <div className="flex items-center gap-2">
                        <Link
                            href={url}
                            className="block min-w-0 cursor-pointer truncate text-xl leading-6 text-lightMain"
                        >
                            {profile.displayName}
                        </Link>
                        <ProfileVerifyBadge profile={profile} className="flex shrink-0 items-center space-x-1" />
                        <SocialSourceIcon source={profile.source} className="ml-auto shrink-0" size={18} />
                    </div>

                    <Link href={url} className="cursor-pointer text-medium leading-6 text-secondary">
                        @{profile.handle}
                    </Link>

                    <div className="flex gap-3 text-medium">
                        <Link
                            href={getProfileUrl(profile, FollowCategory.Following)}
                            className={classNames('gap-1 leading-[22px] hover:underline', {
                                'pointer-events-none':
                                    profile.source !== Source.Farcaster && profile.source !== Source.Lens,
                            })}
                        >
                            <data value={profile.followingCount}>
                                <span className="font-bold text-lightMain">{nFormatter(profile.followingCount)} </span>
                                <span className="text-secondary">
                                    <Trans>Following</Trans>
                                </span>
                            </data>
                        </Link>
                        <FollowersLink profile={profile} className="leading-[22px]" />
                    </div>
                </div>
            </div>

            <BioMarkup
                className="mt-3 line-clamp-2 text-medium leading-[22px] text-lightMain"
                source={profile.source}
                profile={profile}
            >
                {profile.bio ?? '-'}
            </BioMarkup>

            {!isSameProfile(myProfile, profile) ? (
                <FollowButton style={{ height: 40 }} className="min-h-[40px] w-full" profile={profile} />
            ) : null}
        </ClickableArea>
    );
});
