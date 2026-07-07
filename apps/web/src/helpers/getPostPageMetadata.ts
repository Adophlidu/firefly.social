import type { SocialSourceInURL } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { getPostDetailPageData } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/getPostDetailPageData.js';
import { createPostMetadataFromPost } from '@/helpers/createPostMetadataFromPost.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createTwitterPostMetadataFromOembed } from '@/helpers/createTwitterPostMetadataFromOembed.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';

export async function getPostPageMetadata(
    sourceInUrl: SocialSourceInURL,
    postId: string,
    pathname: string,
    searchParams?: { s?: string; sid?: string },
): Promise<Metadata> {
    const ogImageUrl = urlcat(SITE_URL, '/api/og/post/:source/:postId/image', {
        source: sourceInUrl,
        postId,
    });

    if (!isSocialSourceInUrl(sourceInUrl)) {
        return createSiteMetadata(pathname);
    }

    const resolvedSource = resolveSocialSource(sourceInUrl);
    const { post } = await getPostDetailPageData(resolvedSource, postId);

    if (post) {
        return createPostMetadataFromPost(sourceInUrl, postId, post, pathname, searchParams);
    }

    if (sourceInUrl === SourceInURL.Twitter || sourceInUrl === SourceInURL.X) {
        return createTwitterPostMetadataFromOembed(postId, pathname, searchParams);
    }

    return createSiteMetadata(pathname, {
        openGraph: { images: [ogImageUrl] },
        twitter: { images: [ogImageUrl] },
    });
}
