import type { ExploreSourceInURL, SocialSource } from '@dimensiondev/enums';
import { createIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import {
    buildExploreChannelsInitialData,
    type ExploreChannelsInitialData,
} from '@/helpers/buildExploreChannelsInitialData.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

export const getExploreChannelsPageData = cache(
    async (source: string): Promise<ExploreChannelsInitialData | undefined> => {
        const socialSource = resolveSourceFromUrl(source as ExploreSourceInURL) as SocialSource;
        const page = await runInSafeAsync(() =>
            resolveSocialMediaProvider(socialSource).discoverChannels(createIndicator(undefined, '')),
        );
        if (!page?.data.length) return undefined;
        return buildExploreChannelsInitialData(page);
    },
);
