import { memo } from 'react';

import { Source } from '@/constants/enum.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface ProfileNameProps {
    profile: Profile;
}

export const ProfileName = memo(function ProfileName({ profile }: ProfileNameProps) {
    return (
        <div className="inline-flex min-w-0 shrink grow basis-0 flex-col items-start justify-center">
            <div className="w-full truncate break-all text-left text-[16px] font-bold text-main">
                {profile.displayName}
            </div>
            {profile.handle ? (
                <div className="break-all text-left text-medium font-normal text-second">
                    {profile.profileSource === Source.Firefly ? 'UID: ' : '@'}
                    {profile.handle}
                </div>
            ) : null}
        </div>
    );
});
