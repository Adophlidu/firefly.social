import { Trans } from '@lingui/react/macro';

import { ExtraProfiles } from '@/components/Notification/ExtraProfiles.js';
import { ProfileLink } from '@/components/Notification/ProfileLink.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface NotificationProfilesProps {
    profiles: Profile[];
}

export function NotificationProfiles({ profiles }: NotificationProfilesProps) {
    if (!profiles.length) return null;

    if (profiles.length === 1) {
        return <ProfileLink profile={profiles[0]} />;
    }
    if (profiles.length === 2) {
        return (
            <Trans>
                <ProfileLink profile={profiles[0]} /> and <ProfileLink profile={profiles[1]} />
            </Trans>
        );
    }

    return <ExtraProfiles profiles={profiles} />;
}
