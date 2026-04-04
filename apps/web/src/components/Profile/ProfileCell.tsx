import { classNames } from '@dimensiondev/utils';
import { type HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { Link } from '@/components/Link.js';
import { FollowButton } from '@/components/Profile/FollowButton.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource } from '@/constants/enum.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLAnchorElement> {
    profile: Profile;
    source: SocialSource;
}

export function ProfileCell({ profile, source, className, ref, ...rest }: Props) {
    const identity = resolveFireflyIdentity(profile);
    if (!identity) return null;

    return (
        <Link
            href={getProfileUrl(profile)}
            className={classNames('hover:bg-bg flex w-full px-4 py-2', className)}
            data-disable-progress
            {...rest}
        >
            <div className="flex w-full items-center">
                <ProfileTippy identity={identity}>
                    <span>
                        <Avatar
                            className="mr-3 shrink-0 rounded-full border"
                            src={profile?.pfp || profile.pfp}
                            size={40}
                            alt={profile.handle}
                        />
                    </span>
                </ProfileTippy>
                <div className="mr-auto flex max-w-[calc(100%-16px-40px-16px-32px)] flex-col">
                    <div className="text-medium flex items-center justify-start truncate font-bold leading-5">
                        <div className="text-main mr-2 max-w-full truncate text-left">{profile.displayName}</div>
                        <SocialSourceIcon source={source} size={16} className="shrink-0" />
                    </div>
                    <div className="text-medium text-secondary flex items-center gap-2 leading-6">
                        <p className="truncate">@{profile.handle}</p>
                    </div>
                </div>
                <ClickableArea>
                    <FollowButton profile={profile} variant="icon" hasMutedButton={false} />
                </ClickableArea>
            </div>
        </Link>
    );
}
