import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
    const response = await bskySessionHolder.agent.app.bsky.graph.getMutes({
        cursor: indicator?.id,
    });
    const data = resolveBskyResponseData(response, 'Failed to get blocked profiles.');
    return createPageable(
        data.mutes.map((x) => formatBskyProfile(x)),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
