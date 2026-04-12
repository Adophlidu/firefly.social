import { isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { formatPostsFromTruthSocial } from '@/helpers/formatPostsFromTruthSocial.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TruthSocialPostResponse } from '@/providers/types/Firefly.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getTruthSocialPostById(truthId: string): Promise<Post | null> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/truthsocial_trump_detail', {
        truth_id: truthId,
    });
    const response = await fireflySessionHolder.fetch<TruthSocialPostResponse>(url);
    if (!response.data || isEmpty(response.data)) return null;

    return formatPostsFromTruthSocial(response.data);
}
