import { TRUTH_SOCIAL_POST_REGEXP } from '@/constants/regexp.js';
import { memoizePromise } from '@/helpers/memoizePromise.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export const getTruthSocialPostFromUrl = memoizePromise(
    async function (url: string): Promise<Post | null> {
        const match = url.match(TRUTH_SOCIAL_POST_REGEXP);
        if (match?.[2]) {
            const truthId = match[2];
            const post = await FireflyEndpointProvider.getTruthSocialPostById(truthId);
            return post;
        }

        return null;
    },
    (url) => url,
);
