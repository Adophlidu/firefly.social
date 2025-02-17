import { RestrictionType, type SocialSource, Source } from '@/constants/enum.js';

const restrictionConfig: Record<RestrictionType, SocialSource[]> = {
    [RestrictionType.Everyone]: [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky],
    [RestrictionType.Nobody]: [Source.Bsky],
    [RestrictionType.OnlyPeopleYouFollow]: [Source.Lens, Source.Twitter, Source.Bsky],
    [RestrictionType.MentionedProfiles]: [Source.Twitter, Source.Bsky],
};

export function isValidRestrictionType(type: RestrictionType, availableSources: SocialSource[]) {
    if (!restrictionConfig[type]?.length || !availableSources.length) return false;

    return availableSources.some((source) => restrictionConfig[type].includes(source));
}
