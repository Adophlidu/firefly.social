import type { SocialSource } from '@dimensiondev/enums';

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export const getProfileById = memoizePromise(
    async (source: SocialSource, id: string) => {
        return resolveSocialMediaProvider(source).getProfileById(id);
    },
    (source, id) => `${source}-${id}`,
);
