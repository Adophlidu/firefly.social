import { t } from '@lingui/core/macro';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import type { Post } from '@/providers/types/SocialMedia.js';

async function createMetadataForTwitter(postId: string) {
    const timeout = AbortSignal.timeout(60_000);
    const ogResult = await runInSafeAsync(() =>
        OpenGraphProcessor.digestDocumentUrl(`https://x.com/realMaskNetwork/status/${postId}`, timeout),
    );
    if (ogResult?.og) {
        const title = ogResult.og.title || SITE_NAME;
        const description = ogResult.og.description || SITE_DESCRIPTION;
        const ogImage = ogResult.og.image?.url
            ? {
                  url: ogResult.og.image.url,
                  width: ogResult.og.image.width,
                  height: ogResult.og.image.height,
              }
            : `${SITE_URL}/image/og.png`;

        return createSiteMetadata({
            title,
            description,
            openGraph: {
                type: 'article',
                url: urlcat(SITE_URL, getPostUrl({ source: Source.Twitter, postId } as Post)),
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

    return createSiteMetadata();
}

export async function createMetadataPostById(source: SocialSourceInURL, postId: string) {
    if (source === SourceInURL.Twitter) return createMetadataForTwitter(postId);

    const provider = resolveSocialMediaProvider(resolveSocialSource(source));
    const post = await provider.getPostById(postId).catch(() => null);
    if (!post) return createSiteMetadata();

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

    const ogImage = urlcat(SITE_URL, '/api/og/post/:source/:postId/image', {
        source,
        postId,
    });

    const title = post?.author.displayName
        ? await createPageTitleSSR(() => t`Posted by ${post.author.displayName} via Firefly`)
        : SITE_NAME;

    return createSiteMetadata({
        title,
        description: post.metadata.content?.content ?? '',
        openGraph: {
            type: 'article',
            url: urlcat(SITE_URL, getPostUrl(post)),
            title,
            description: post.metadata.content?.content ?? '',
            images: [ogImage],
            audio: audios,
            videos,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: post.metadata.content?.content ?? '',
            images: [ogImage],
        },
    });
}
