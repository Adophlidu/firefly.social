import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from '@/compat/nextMetadata.js';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

type ActivityInfo = NonNullable<ActivityInfoResponse['data']>;

export function createEventMetadataFromActivity(info: ActivityInfo, name: string, pathname: string): Metadata {
    const title = info.title;
    const description = info.description;
    const images = [info.open_graph_url];

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'website',
            url: urlcat(SITE_URL, `/event/${name}`),
            title,
            description,
            images,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    });
}
