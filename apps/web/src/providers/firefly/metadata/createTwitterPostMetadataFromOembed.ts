import { SITE_DESCRIPTION, SITE_NAME } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { runInSafeAsync } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { Metadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';

function extractTwitterProfileByOpengraphTitle(title: string) {
    const [displayName, handle] = title.split(' ') as [string, string | undefined];
    const regex = /\(@([\w_]+)\)/;
    const matched = handle?.match(regex);

    return matched
        ? {
              displayName,
              handle: matched[1],
          }
        : {
              displayName,
              handle,
          };
}

function formatOgSearchParams(searchParams?: { s?: string; sid?: string }) {
    const sidValue = searchParams?.sid ?? searchParams?.s;
    return sidValue ? `?sid=${sidValue}` : '';
}

export async function createTwitterPostMetadataFromOembed(
    postId: string,
    pathname: string,
    searchParams?: { s?: string; sid?: string },
): Promise<Metadata> {
    const ogResult = await runInSafeAsync(() =>
        OpenGraphProcessor.digestDocumentUrl(`https://x.com/masknetwork/status/${postId}`),
    );
    const ogImage = urlcat(SITE_URL, `/api/og/post/twitter/${postId}/image${formatOgSearchParams(searchParams)}`);

    let title = SITE_NAME;
    let description = SITE_DESCRIPTION;

    if (ogResult?.og) {
        const { handle } = extractTwitterProfileByOpengraphTitle(ogResult.og.title ?? '');
        title = handle ? `View @${handle}'s post on Firefly` : ogResult.og.title || SITE_NAME;
        description = ogResult.og.description || SITE_DESCRIPTION;
    }

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'article',
            url: urlcat(SITE_URL, resolvePostUrl(Source.Twitter, postId)),
            title,
            description,
            images: [ogImage],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    });
}
