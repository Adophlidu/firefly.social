import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

import { RestrictionType } from '@/constants/enum.js';

const restrictionConfig: Record<RestrictionType, SocialSource[]> = {
    [RestrictionType.Everyone]: [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky],
    [RestrictionType.Nobody]: [Source.Bsky],
    [RestrictionType.OnlyPeopleYouFollow]: [Source.Twitter, Source.Bsky],
    [RestrictionType.YouFollower]: [Source.Bsky, Source.Lens],
    [RestrictionType.MentionedProfiles]: [Source.Twitter, Source.Bsky],
};

export function isValidRestrictionType(type: RestrictionType, availableSources: SocialSource[]) {
    if (!restrictionConfig[type]?.length || !availableSources.length) return false;

    return availableSources.every((source) => restrictionConfig[type].includes(source));
}
