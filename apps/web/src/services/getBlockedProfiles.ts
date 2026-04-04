import { EMPTY_LIST } from '@dimensiondev/constants';

import { type SocialSourceInURL } from '@/constants/enum.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { getBlockedRelations } from '@/providers/firefly/endpoint/getBlockedRelations.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { getProfilesByIds } from '@/services/getProfilesByIds.js';

export async function getBlockedProfiles(
    indicator?: PageIndicator,
    source?: SocialSourceInURL,
): Promise<Pageable<Profile, PageIndicator>> {
    const relations = await getBlockedRelations(indicator, source);
    const blockedIds = relations.blocks.map((x) => x.snsId);
    const profiles: Profile[] = blockedIds?.length && source ? await getProfilesByIds(source, blockedIds) : EMPTY_LIST;

    const blockedProfiles: Profile[] = profiles.map((profile) => ({
        ...profile,
        // since we use our own mute system, we need to set blocking to true manually
        viewerContext: { ...profile.viewerContext, blocking: true },
    }));

    return createPageable(
        blockedProfiles,
        createIndicator(indicator),
        relations.nextPage ? createNextIndicator(indicator, `${relations.nextPage}`) : undefined,
    );
}
