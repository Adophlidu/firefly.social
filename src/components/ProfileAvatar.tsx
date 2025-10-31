import { classNames } from '@firefly/utils';
import type { HTMLProps } from 'react';
import { memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { Link } from '@/esm/Link.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { useSizeStyle } from '@/hooks/useSizeStyle.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export interface ProfileAvatarProps extends HTMLProps<HTMLElement> {
    profile: Profile;
    size?: number;
    loading?: boolean;
    linkable?: boolean;
    clickable?: boolean;
    enableSourceIcon?: boolean;
    enableDefaultAvatar?: boolean;
    fallbackUrl?: string;
}

export const ProfileAvatar = memo(function ProfileAvatar({
    ref,
    profile,
    fallbackUrl,
    loading = false,
    linkable = false,
    clickable = false,
    enableSourceIcon = true,
    enableDefaultAvatar = false,
    ...props
}: ProfileAvatarProps) {
    const isLarge = useIsLarge();

    const size = props.size ?? (isLarge ? 40 : 36);
    const style = useSizeStyle(size, props.style);

    const profileSource = profile.profileSource ?? profile.source;
    const stampAvatar = getStampAvatarByProfileId(profileSource, profile.profileId);
    const profileAvatar = !profile.pfp && enableDefaultAvatar && stampAvatar ? stampAvatar : profile.pfp;

    const content = (
        <div className="relative z-0" style={style}>
            <div className="absolute left-0 top-0 rounded-full" style={style}>
                <Avatar src={profileAvatar} size={size} alt={profile.displayName} fallbackUrl={fallbackUrl} />
            </div>
            {loading ? (
                <div className="absolute left-0 top-0 z-10">
                    <LoadingIcon className="text-primaryBottom" size={size} />
                </div>
            ) : null}
            {enableSourceIcon ? (
                <ProfileSourceIcon
                    source={profileSource}
                    size={16}
                    className="absolute -bottom-px -right-[8px] z-10 size-4 rounded-full border border-white"
                />
            ) : null}
        </div>
    );

    if (linkable) {
        return (
            <Link
                className={classNames('flex items-start justify-start md:mx-auto lg:m-0', {
                    'cursor-pointer': clickable,
                })}
                style={style}
                href={getProfileUrl(profile)}
                {...props}
            >
                {content}
            </Link>
        );
    }

    return (
        <div
            className={classNames('flex items-start justify-start md:mx-auto lg:m-0', {
                'cursor-pointer': clickable,
            })}
            style={style}
            {...props}
        >
            {content}
        </div>
    );
});
