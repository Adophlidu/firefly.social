import type { SocialSourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from 'next';
import { cache } from 'react';

import { compactChannelForPageTransfer } from '@/helpers/compactChannelForPageTransfer.js';
import { createChannelMetadataFromChannel } from '@/helpers/createChannelMetadataFromChannel.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createChannelMetadata } from '@/providers/firefly/metadata/createChannelMetadata.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export const getChannelPageData = cache(async (source: SocialSourceInURL, id: string): Promise<Channel | null> => {
    const resolvedSource = resolveSocialSource(source);
    const channel = await runInSafeAsync(() => resolveSocialMediaProvider(resolvedSource).getChannelById(id));
    if (!channel) return null;
    return compactChannelForPageTransfer(channel);
});

export async function getChannelPageMetadata(
    source: SocialSourceInURL,
    id: string,
    pathname: string,
): Promise<Metadata> {
    const channel = await runInSafeAsync(() => getChannelPageData(source, id));
    if (channel) {
        return createChannelMetadataFromChannel(channel, source, id, pathname);
    }

    return createChannelMetadata(source, id, pathname);
}
