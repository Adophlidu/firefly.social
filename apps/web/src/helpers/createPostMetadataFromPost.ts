import { SITE_NAME } from '@dimensiondev/constants/static';
import type { SocialSourceInURL } from '@dimensiondev/enums';
import { AttachmentType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { compact } from 'lodash-es';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getPostDescriptionFromPost } from '@/helpers/getPostDescriptionFromPost.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function formatOgSearchParams(searchParams?: { s?: string; sid?: string }) {
    const sidValue = searchParams?.sid ?? searchParams?.s;
    return sidValue ? `?sid=${sidValue}` : '';
}

export function createPostMetadataFromPost(
    sourceInUrl: SocialSourceInURL,
    postId: string,
    post: Post,
    pathname: string,
    searchParams?: { s?: string; sid?: string },
): Metadata {
    const handle = post.author.handle;
    const title = handle ? `View @${handle}'s post on Firefly` : SITE_NAME;
    const description = getPostDescriptionFromPost(post);
    const ogImageUrl = urlcat(SITE_URL, `/api/og/post/:source/:postId/image${formatOgSearchParams(searchParams)}`, {
        source: sourceInUrl,
        postId,
    });
    const audios = compact(
        post.metadata.content?.attachments?.map((attachment) =>
            attachment.type === AttachmentType.Audio && attachment.uri ? { url: attachment.uri } : undefined,
        ),
    );
    const videos = compact(
        post.metadata.content?.attachments?.map((attachment) =>
            attachment.type === AttachmentType.Video && attachment.uri ? { url: attachment.uri } : undefined,
        ),
    );
    if (post.metadata.content?.asset?.type === AttachmentType.Video && post.metadata.content.asset.uri) {
        videos.push({ url: post.metadata.content.asset.uri });
    }

    const resolvedSource = resolveSocialSource(sourceInUrl);

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'article',
            url: urlcat(SITE_URL, resolvePostUrl(resolvedSource, postId) ?? ''),
            title,
            description,
            images: [ogImageUrl],
            audio: audios.length ? audios : undefined,
            videos: videos.length ? videos : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    });
}
