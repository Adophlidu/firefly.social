import { metadataWorker } from '@dimensiondev/workers-client';
import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { settings } from '@/settings/index.js';

export async function createChannelMetadata(source: string, channelId: string, pathname: string): Promise<Metadata> {
    try {
        const res = await metadataWorker['metadata-v2'].channel.$get(
            { query: { source, id: channelId, pathname } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok) return createSiteMetadata(pathname);
        const json = await res.json();
        return resolveResponseData(json);
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
