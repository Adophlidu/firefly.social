import { memo } from 'react';

import { Source } from '@/constants/enum.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileNameProps {
    profile: Profile;
}

export const ProfileName = memo(function ProfileName({ profile }: ProfileNameProps) {
    return (
        <div className="inline-flex min-w-0 shrink grow basis-0 flex-col items-start justify-center">
            <div className="text-main w-full truncate break-all text-left text-[16px] font-bold">
                {profile.displayName}
            </div>
            {profile.handle ? (
                <div className="text-medium text-second break-all text-left font-normal">
                    {profile.profileSource === Source.Firefly ? 'UID: ' : '@'}
                    {profile.handle}
                </div>
            ) : null}
        </div>
    );
});
