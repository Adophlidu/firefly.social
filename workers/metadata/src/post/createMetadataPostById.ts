import type { SocialSourceInURL } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import { digestDocumentUrl } from '@dimensiondev/workers-oembed/digestDocumentUrl.js';
import { SITE_DESCRIPTION, SITE_NAME } from '@dimensiondev/workers-shared/constants/metadata.js';
import { compact } from '@dimensiondev/workers-shared/helpers/compact.js';
import { createSiteMetadata } from '@dimensiondev/workers-shared/helpers/createSiteMetadata.js';
import { fetchFireflyRpc } from '@dimensiondev/workers-shared/helpers/fetchFireflyRpc.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { runInSafeAsync } from '@dimensiondev/workers-shared/helpers/runInSafe.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import { getPostPathname } from '@/metadata/src/post/getPostPathname.js';
import { extractTwitterProfileByOpengraphTitle } from '@/metadata/src/post/getTwitterProfileByOG.js';

async function createMetadataForTwitter(pathname: string, postId: string, searchParams: string, context: Context) {
    const ogResult = await runInSafeAsync(() =>
        digestDocumentUrl(`https://x.com/masknetwork/status/${postId}`, context),
    );
    const ogImage = urlcat(resolveSiteUrl(context), `/api/og/post/twitter/${postId}/image${searchParams}`);

    const openGraph = {
        type: 'article',
        url: urlcat(resolveSiteUrl(context), getPostPathname({ source: Source.Twitter, postId } as FireflyPost)),
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        images: [ogImage],
    };
    const twitter = {
        card: 'summary_large_image',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        images: [ogImage],
    };
    if (ogResult?.og) {
        const { handle } = extractTwitterProfileByOpengraphTitle(ogResult.og.title ?? '');
        const title = handle ? `View @${handle}'s post on Firefly` : ogResult.og.title || SITE_NAME;
        const description = ogResult.og.description || SITE_DESCRIPTION;

        Object.assign(openGraph, { title, description });
        Object.assign(twitter, { title, description });
        return createSiteMetadata(pathname, {
            title,
            description,
            openGraph,
            twitter,
        });
    }

    return createSiteMetadata(pathname, { openGraph, twitter });
}

export async function createMetadataPostById(
    pathname: string,
    source: SocialSourceInURL,
    postId: string,
    searchParams: string,
    context: Context,
) {
    const post = await fetchFireflyRpc<FireflyPost | null>(source, 'getPostById', { postId }, context).catch(
        () => null,
    );
    if (!post) {
        if (source === SourceInURL.Twitter) {
            return createMetadataForTwitter(pathname, postId, searchParams, context);
        }
        return createSiteMetadata(pathname);
    }

    const audios = compact(
        post.metadata.content?.attachments?.map((x) => {
            const url = x.type === 'Audio' ? x.uri : undefined;
            return url ? { url } : undefined;
        }),
    );
    const videos = compact(
        post.metadata.content?.attachments?.map((x) => {
            const url = x.type === 'Video' ? x.uri : undefined;
            return url ? { url } : undefined;
        }),
    );

    const ogImage = urlcat(resolveSiteUrl(context), `/api/og/post/${source}/${postId}/image${searchParams}`);

    const handle = post.author?.handle;
    const title = handle ? `View @${handle}'s post on Firefly` : SITE_NAME;

    return createSiteMetadata(pathname, {
        title,
        description:
            'Join the conversation on Firefly: follow, comment and engage with Web3 social posts in real time.',
        openGraph: {
            type: 'article',
            url: urlcat(resolveSiteUrl(context), getPostPathname(post)),
            title,
            description:
                'Join the conversation on Firefly: follow, comment and engage with Web3 social posts in real time.',
            images: [ogImage],
            audio: audios,
            videos,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description:
                'Join the conversation on Firefly: follow, comment and engage with Web3 social posts in real time.',
            images: [ogImage],
        },
    });
}
