'use client';

import { Plural, Trans } from '@lingui/react/macro';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { NoSSR } from '@/components/NoSSR.js';
import { Mutuals } from '@/components/Profile/Mutuals.js';
import { ProfileAction } from '@/components/Profile/ProfileAction.js';
import { ProfileVerifyBadge } from '@/components/ProfileVerifyBadge/index.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { FollowCategory, Source } from '@/constants/enum.js';
import { ENABLED_FOLLOWING_LIST_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getLargeTwitterAvatar } from '@/helpers/getLargeTwitterAvatar.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { useRefreshedProfile } from '@/hooks/useRefreshedProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface InfoProps {
    profile: Profile;
}

export const PROFILE_ACTION_ID = 'profile-action';

export function SocialProfileInfo(props: InfoProps) {
    const { data: profile = props.profile } = useRefreshedProfile(props.profile);

    const { source, followerCount = 0, followingCount = 0 } = profile;

    return (
        <div className="grid grid-cols-[40px_calc(100%-40px-12px)] gap-2.5 p-3">
            {profile.pfp ? (
                <Avatar
                    src={source === Source.Twitter ? getLargeTwitterAvatar(profile.pfp) : profile.pfp}
                    alt="avatar"
                    size={40}
                    className="size-10 rounded-full"
                />
            ) : (
                <SocialSourceIcon className="rounded-full" source={source} size={40} />
            )}

            <div className="relative flex w-full flex-col">
                <div className="flex w-full flex-col">
                    <div className="-mb-2 flex h-8 w-full items-start gap-2">
                        <div className="flex h-6 items-center gap-2">
                            <TextOverflowTooltip content={profile.displayName} placement="top">
                                <address className="truncate text-lg font-black not-italic leading-6 text-lightMain">
                                    {profile.displayName}
                                </address>
                            </TextOverflowTooltip>
                            <ProfileVerifyBadge
                                className="flex flex-shrink-0 items-center space-x-1"
                                profile={profile}
                            />
                        </div>
                        <div id={PROFILE_ACTION_ID} className="ml-auto flex items-center gap-2">
                            <NoSSR>
                                <ProfileAction profile={profile} />
                            </NoSSR>
                        </div>
                    </div>
                    <span className="text-medium text-secondary">@{profile.handle}</span>
                </div>

                <BioMarkup className="break-word text-medium" source={profile.source}>
                    {profile.bio ?? '-'}
                </BioMarkup>

                <div className="flex gap-3 text-sm leading-[22px]">
                    <Link
                        href={resolveProfileUrl(source, resolveFireflyProfileId(profile), FollowCategory.Following)}
                        className={classNames('gap-1 hover:underline', {
                            'pointer-events-none': !ENABLED_FOLLOWING_LIST_SOURCES.includes(source),
                        })}
                    >
                        <data value={followingCount}>
                            <span className="font-bold text-lightMain">{nFormatter(followingCount)} </span>
                            <span className="text-secondary">
                                <Trans>Following</Trans>
                            </span>
                        </data>
                    </Link>

                    <Link
                        href={resolveProfileUrl(source, resolveFireflyProfileId(profile), FollowCategory.Followers)}
                        className={classNames('gap-1 hover:underline', {
                            'pointer-events-none': !ENABLED_FOLLOWING_LIST_SOURCES.includes(source),
                        })}
                    >
                        <data value={followerCount}>
                            <span className="font-bold text-lightMain">{nFormatter(followerCount)} </span>
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
