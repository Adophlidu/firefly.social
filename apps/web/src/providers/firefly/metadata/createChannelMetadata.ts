import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { Metadata } from 'next';

import { getChannelPageMetadata } from '@/app/[locale]/(normal)/club/[source]/[id]/getChannelPageData.js';

export async function createChannelMetadata(source: string, channelId: string, pathname: string): Promise<Metadata> {
    return getChannelPageMetadata(source as SocialSourceInURL, channelId, pathname);
}
