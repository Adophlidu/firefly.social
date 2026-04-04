import { uniqBy } from 'lodash-es';

import { type Profile } from '@/providers/types/SocialMedia.js';

export function uniqProfiles(profiles: Profile[]): Profile[] {
    return uniqBy(profiles, (profile) => `${profile.source}:${profile.profileId}`);
}
