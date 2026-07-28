import type { SocialSourceInURL } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import type { Metadata } from '@/compat/nextMetadata.js';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createChannelMetadataFromChannel } from '@/providers/firefly/metadata/createChannelMetadataFromChannel.js';
import { getChannelPageData } from '@/providers/firefly/metadata/getChannelPageData.js';

export async function getChannelPageMetadata(
    source: SocialSourceInURL,
    id: string,
    pathname: string,
): Promise<Metadata> {
    const channel = await runInSafeAsync(() => getChannelPageData(source, id));
    if (channel) {
        return createChannelMetadataFromChannel(channel, source, id, pathname);
    }

    return createSiteMetadata(pathname);
}
