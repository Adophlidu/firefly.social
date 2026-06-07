import type { Metadata } from 'next';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { metadataWorker } from '@/providers/firefly/worker/clients.js';
import { settings } from '@/settings/index.js';

export async function createEventMetadata(
    eventName: string,
    pathname: string,
    replaceName?: string,
): Promise<Metadata> {
    try {
        const res = await metadataWorker['metadata-v2'].event.$get(
            { query: { name: eventName, pathname, replaceName } },
            { headers: { 'X-DEVELOPMENT-API': settings.dev ? 'true' : 'false' } },
        );
        if (!res.ok) return createSiteMetadata(pathname);
        const json = await res.json();
        return resolveResponseData(json);
    } catch (error) {
        return createSiteMetadata(pathname);
    }
}
