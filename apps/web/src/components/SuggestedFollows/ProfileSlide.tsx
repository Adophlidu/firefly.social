import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { FollowersLink } from '@/components/Profile/FollowersLink.js';
import { ProfileTippy } from '@/components/Profile/ProfileTippy.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';

import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveFireflyIdentity } from '@/helpers/resolveFireflyProfileId.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileSlideProps {
    profile: Profile;
}

export const ProfileSlide = memo<ProfileSlideProps>(function ProfileSlide({ profile }) {
    const identity = resolveFireflyIdentity(profile);
    if (!identity) return null;

    const hideFollowers = profile.source === Source.Lens;

    return (
        <div className="relative cursor-pointer">
            <div className="bg-lightBottom shadow-primary dark:bg-primaryBottom h-[184px] w-[164px] rounded-2xl px-3 py-6 backdrop-blur">
                <div
                    className={classNames('size-[56px] rounded-full border-2 p-0.5', {
                        'border-farcasterPrimary': profile.source === Source.Farcaster,
                        'border-lensPrimary': profile.source === Source.Lens,
                    })}
                >
                    <ProfileAvatar profile={profile} size={48} enableSourceIcon={false} />
                </div>
                <div className="flex-start flex items-center gap-1 truncate text-sm font-bold leading-6">
                    <ProfileTippy identity={identity}>
                        <Link
                            href={getProfileUrl(profile)}
                            prefetch={false}
                            className="link-overlay text-medium text-main mr-0.5 max-w-full cursor-pointer truncate"
                        >
                            {profile.displayName}
                        </Link>
                    </ProfileTippy>
                    <SocialSourceIcon source={profile.source} size={15} className="shrink-0" />
                </div>
                {hideFollowers ? null : (
                    <FollowersLink profile={profile} className="z-1 text-second relative text-xs leading-6" />
                )}
                <BioMarkup
                    className={classNames('text-lightMain text-xs', hideFollowers ? 'line-clamp-4' : 'line-clamp-2')}
                    source={profile.source}
                    profile={profile}
                    components={{ a: 'a' }}
                >
                    {profile.bio ?? '-'}
                </BioMarkup>
            </div>
        </div>
    );
});
