'use client';

import { FollowCategory, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';

import { Avatar } from '@/components/Avatar.js';
import { DefiUnitedBadge } from '@/components/DefiUnitedBadge/index.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { NoSSR } from '@/components/NoSSR.js';
import { HighlightedText } from '@/components/Profile/HighlightedText.js';
import { Mutuals } from '@/components/Profile/Mutuals.js';
import { ProfileAction } from '@/components/Profile/ProfileAction.js';
import { ProfileVerifyBadge } from '@/components/ProfileVerifyBadge/index.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { ENABLED_FOLLOWING_LIST_SOURCES } from '@/constants/computed.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { useDefiUnitedBadgeByProfile } from '@/hooks/useDefiUnitedBadge.js';
import { useProfileHighlighted } from '@/hooks/useProfileHighlighted.js';
import { useRefreshedProfileInProfilePage } from '@/hooks/useRefreshedProfile.js';
import { getLargeTwitterAvatar } from '@/providers/twitter/getLargeTwitterAvatar.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface InfoProps {
    profile: Profile;
}

export const PROFILE_ACTION_ID = 'profile-action';

export function SocialProfileInfo(props: InfoProps) {
    const { profile } = useRefreshedProfileInProfilePage(props.profile);
    const { data: highlighted } = useProfileHighlighted(props.profile);
    const { data: defiUnitedTier } = useDefiUnitedBadgeByProfile(profile);

    const { source, followerCount = 0, followingCount = 0 } = profile;

    return (
        <div className="grid grid-cols-[40px_calc(100%-40px-12px)] gap-x-2.5 p-4">
            <Avatar
                src={
                    source === Source.Twitter
                        ? getLargeTwitterAvatar(profile.pfp)
                        : profile.pfp || getStampAvatarByProfileId(profile.source, profile.profileId)
                }
                alt="avatar"
                size={40}
                className={classNames('size-10 rounded-full border', {
                    'border-farcasterPrimary': profile.source === Source.Farcaster,
                    'border-lensButton': profile.source === Source.Lens,
                    'border-bskyPrimary': profile.source === Source.Bsky,
                    'border-main': profile.source === Source.Twitter,
                })}
            />

            <div className="relative flex w-full flex-col">
                <div className="flex w-full flex-col">
                    <div className="flex h-8 w-full items-start gap-2 md:-mb-2">
                        <div className="flex h-8 min-w-0 flex-1 items-center gap-2 md:h-6">
                            <TextOverflowTooltip content={profile.displayName} placement="top">
                                <h1 className="text-lightMain min-w-0 truncate text-lg font-black not-italic leading-6">
                                    {!profile.displayName ? (
                                        '-'
                                    ) : highlighted ? (
                                        <HighlightedText text={profile.displayName} />
                                    ) : (
                                        profile.displayName
                                    )}
                                </h1>
                            </TextOverflowTooltip>
                            <ProfileVerifyBadge className="flex shrink-0 items-center space-x-1" profile={profile} />
                            {defiUnitedTier ? <DefiUnitedBadge tier={defiUnitedTier} className="shrink-0" /> : null}
                        </div>
                        <div id={PROFILE_ACTION_ID} className="ml-auto flex items-center gap-2">
                            <NoSSR>
                                <ProfileAction profile={profile} />
                            </NoSSR>
                        </div>
                    </div>
                    <span className="text-medium text-secondary">@{profile.handle}</span>
                </div>

                <BioMarkup
                    className="break-word text-medium max-md:line-clamp-2"
                    source={profile.source}
                    profile={profile}
                >
                    {profile.bio ?? '-'}
                </BioMarkup>

                <div className="flex gap-3 text-sm leading-[22px]">
                    <Link
                        href={getProfileUrl(profile, FollowCategory.Following)}
                        className={classNames('gap-1 hover:underline', {
                            'pointer-events-none': !ENABLED_FOLLOWING_LIST_SOURCES.includes(source),
                        })}
                    >
                        <data value={followingCount}>
                            <span className="text-lightMain font-bold">{nFormatter(followingCount)} </span>
                            <span className="text-secondary">
                                <Trans>Following</Trans>
                            </span>
                        </data>
                    </Link>

                    <Link
                        href={getProfileUrl(profile, FollowCategory.Followers)}
                        className={classNames('gap-1 hover:underline', {
                            'pointer-events-none': !ENABLED_FOLLOWING_LIST_SOURCES.includes(source),
                        })}
                    >
                        <data value={followerCount}>
                            <span className="text-lightMain font-bold">{nFormatter(followerCount)} </span>
                            <span className="text-secondary">
                                <Plural value={followerCount} one="Follower" other="Followers" />
                            </span>
                        </data>
                    </Link>
                </div>
            </div>
            <Mutuals profile={profile} />
        </div>
    );
}
