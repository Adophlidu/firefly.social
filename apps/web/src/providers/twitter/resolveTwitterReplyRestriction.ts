import { RestrictionType } from '@dimensiondev/enums';
import { createLookupTableResolver } from '@dimensiondev/utils';

export const resolveTwitterReplyRestriction = createLookupTableResolver<
    RestrictionType,
    'following' | 'mentionedUsers' | undefined
>(
    {
        [RestrictionType.Everyone]: undefined,
        [RestrictionType.Nobody]: undefined,
        [RestrictionType.YouFollower]: undefined,
        [RestrictionType.OnlyPeopleYouFollow]: 'following',
        [RestrictionType.MentionedProfiles]: 'mentionedUsers',
    },
    undefined,
);
