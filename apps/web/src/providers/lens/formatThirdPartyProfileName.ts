import { Source } from '@dimensiondev/enums';

import { EMAIL_REGEX } from '@/constants/regexp.js';
import { formatEmail } from '@/helpers/formatEmail.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function formatThirdPartyProfileName(profile: Profile) {
    if (profile.profileSource === Source.Telegram) {
        return profile.displayName.length > 5
            ? `@${profile.displayName.slice(0, 2)}*****${profile.displayName.slice(-3)}`
            : `@${profile.displayName}`;
    }

    if (EMAIL_REGEX.test(profile.displayName)) return formatEmail(profile.displayName);

    return profile.displayName;
}
