'use client';

import { classNames } from '@dimensiondev/utils';
import { type HTMLProps } from 'react';

import { Avatar, type AvatarProps } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { type FireflyProfile } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface AvatarGroupProps extends HTMLProps<HTMLDivElement> {
    profiles: Profile[] | FireflyProfile[];
    AvatarProps?: Omit<AvatarProps, 'alt'>;
}

export function AvatarGroup({ profiles, AvatarProps }: AvatarGroupProps) {
    return (
        <div className="flex items-center">
            {profiles.map((profile, index, self) => {
                const isFireflyProfile = 'identity' in profile;
                const identity = isFireflyProfile ? profile.identity : resolveFireflyIdentity(profile);
                if (!identity) return null;
                const avatar = (
                    <Avatar
                        src={isFireflyProfile ? getStampAvatarByProfileId(identity.source, identity.id) : profile.pfp}
                        size={40}
                        alt={identity.id}
                        {...AvatarProps}
                    />
                );

                return (
                    <ProfileTippy key={identity.id} identity={identity}>
                        {isFireflyProfile ? (
                            <span
                                className={classNames('relative inline-flex items-center', {
                                    '-ml-2.5': index > 0 && self.length > 1,
                                })}
                            >
                                {avatar}
                            </span>
                        ) : (
                            <Link
                                href={
                                    isFireflyProfile
                                        ? `/profile/${resolveSourceInUrl(identity.source)}/${identity.id}`
                                        : getProfileUrl(profile)
                                }
                                className={classNames('relative inline-flex items-center', {
                                    '-ml-2.5': index > 0 && self.length > 1,
                                })}
                                style={{ zIndex: self.length - index }}
                            >
                                {avatar}
                            </Link>
                        )}
                    </ProfileTippy>
                );
            })}
        </div>
    );
}
