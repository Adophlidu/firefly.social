import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { type RequestedLoginSource, type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource, resolveSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { extractTwitterProfileByOpengraphTitle } from '@/services/getTwitterProfileByOG.js';

async function createMetadataForTwitter(postId: string) {
    const timeout = AbortSignal.timeout(60_000);
    const ogResult = await runInSafeAsync(() =>
        OpenGraphProcessor.digestDocumentUrl(`https://x.com/realMaskNetwork/status/${postId}`, timeout),
    );
    if (ogResult?.og) {
        const { displayName } = extractTwitterProfileByOpengraphTitle(ogResult.og.title ?? '');
        const title = displayName
            ? await createPageTitleSSR(() => t`Posted by ${displayName} via Firefly`, { displayName })
            : ogResult.og.title || SITE_NAME;
        const description = ogResult.og.description || SITE_DESCRIPTION;
        const ogImage = urlcat(SITE_URL, '/api/og/post/:source/:postId/image', {
            source: SourceInURL.Twitter,
            postId,
        });

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

async function createMetadataForLoginRequestSource(source: RequestedLoginSource, postId: string) {
    switch (source) {
        case Source.Twitter:
            return createMetadataForTwitter(postId);
        default:
            safeUnreachable(source);
            return createSiteMetadata();
    }
}

export async function createMetadataPostById(source: SocialSourceInURL, postId: string) {
    const resolvedSource = resolveSource(source);
    if (isRequestedLoginSource(resolvedSource)) {
        return createMetadataForLoginRequestSource(resolvedSource, postId);
    }

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

    const displayName = post.author?.displayName;
    const title = displayName
        ? await createPageTitleSSR(() => t`Posted by ${displayName} via Firefly`, { displayName })
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
