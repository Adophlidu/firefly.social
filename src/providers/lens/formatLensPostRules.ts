import { type CreatePostRequest } from '@lens-protocol/client';

import { RestrictionType } from '@/constants/enum.js';

export function formatLensPostRules(restrictions?: RestrictionType[]): CreatePostRequest['rules'] {
    const followersOnly = restrictions?.includes(RestrictionType.YouFollower);
    if (!followersOnly) return;

    return {
        required: [
            {
                followersOnlyRule: {
                    repliesRestricted: true,
                },
            },
        ],
    };
}
