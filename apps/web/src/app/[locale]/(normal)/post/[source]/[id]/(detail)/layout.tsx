import { SITE_NAME } from '@dimensiondev/constants/static';
import type { SourceInURL } from '@dimensiondev/enums';
import { AttachmentType } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import type { LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import type { Metadata } from 'next';
import urlcat from 'urlcat';

import { getPostDetailPageData } from '@/app/[locale]/(normal)/post/[source]/[id]/(detail)/getPostDetailPageData.js';
import { Comeback } from '@/components/Comeback.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getPostDescriptionFromPost } from '@/helpers/getPostDescriptionFromPost.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';

interface Props extends LayoutProps<{ id: string; source: string; locale: string }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id } = await props.params;
    const typedSource = source as SourceInURL;
    const pathname = `/post/${source}/${id}`;

    if (!isSocialSourceInUrl(typedSource)) {
        return createSiteMetadata(pathname);
    }

    const resolvedSource = resolveSocialSource(typedSource);
    const { post } = await getPostDetailPageData(resolvedSource, id);

    if (!post) {
        return createPostMetadata(typedSource, id, pathname);
    }

    const handle = post.author.handle;
    const title = handle ? `View @${handle}'s post on Firefly` : SITE_NAME;
    const description = getPostDescriptionFromPost(post);
    const ogImageUrl = urlcat(SITE_URL, '/api/og/post/:source/:postId/image', {
        source: typedSource,
        postId: id,
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

    return createSiteMetadata(pathname, {
        title,
        description,
        openGraph: {
            type: 'article',
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

export default async function Layout(props: Props) {
    const params = await props.params;
    setupLocaleFromParams(params.locale);

    return (
        <>
            <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </header>
            {props.children}
        </>
    );
}
