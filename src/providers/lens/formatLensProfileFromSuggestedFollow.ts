import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { LensV3Profile } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function formatLensProfileFromSuggestedFollow(result: LensV3Profile): Profile {
    return {
        ...createDummyProfile(Source.Lens),
        profileId: result.id,
        displayName: result.localName || '',
        handle: result.localName || '',
        fullHandle: result.fullHandle || '',
    };
}
