import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createEventMetadataFromActivity } from '@/providers/firefly/metadata/createEventMetadataFromActivity.js';
import { getEventPageData } from '@/providers/firefly/metadata/getEventPageData.js';

export async function getEventPageMetadata(name: string, pathname: string, replaceName?: string): Promise<Metadata> {
    const data = await getEventPageData(replaceName || name);
    if (!data) return createSiteMetadata(pathname);
    return createEventMetadataFromActivity(data, name, pathname);
}
