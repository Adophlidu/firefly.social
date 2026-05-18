import type { BookmarkType } from '@dimensiondev/enums';
import { FireflyPlatform } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

export async function bookmark(
    postId: string,
    platform?: FireflyPlatform,
    profileId?: string,
    postType?: BookmarkType,
): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/create');
    const response = await fireflySessionHolder.fetch<string>(url, {
        method: 'POST',
        body: JSON.stringify({
            platform: (platform === FireflyPlatform.NFTs ? 'nft' : platform) ?? FireflyPlatform.Farcaster,
            platform_id: profileId,
            post_type: postType,
            post_id: postId,
        }),
    });
    if (response) return true;
    throw new Error('Failed to bookmark.');
}
