import type { SocialSourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { compactChannelForPageTransfer } from '@/helpers/compactChannelForPageTransfer.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export const getChannelPageData = cache(async (source: SocialSourceInURL, id: string): Promise<Channel | null> => {
    const resolvedSource = resolveSocialSource(source);
    const channel = await runInSafeAsync(() => resolveSocialMediaProvider(resolvedSource).getChannelById(id));
    if (!channel) return null;
    return compactChannelForPageTransfer(channel);
});
