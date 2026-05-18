import { FireflyPlatform } from '@dimensiondev/enums';

import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';
import { getBlockRelation } from '@/providers/firefly/endpoint/getBlockRelation.js';

export async function isProfileMuted(platform: FireflyPlatform, profileId: string): Promise<boolean> {
    // TODO firefly doesn't support bsky
    if (platform === FireflyPlatform.Bsky) {
        const profile = await getBskyProfileById(profileId);
        return !!profile.viewerContext?.blocking;
    }
    const blockRelationList = await getBlockRelation([
        {
            snsPlatform: platform,
            snsId: profileId,
        },
    ]);
    return !!blockRelationList.find((x) => x.snsId === profileId)?.blocked;
}
