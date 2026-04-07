import { type LayoutProps } from '@dimensiondev/types';
import { Trans } from '@lingui/react/macro';
import { type Metadata } from 'next';

import { Comeback } from '@/components/Comeback.js';
import { ArticleMarkup } from '@/components/Markup/ArticleMarkup.js';
import { Locale, type SocialSourceInURL, Source, SourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleFromParams } from '@/i18n/static.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { createFireflyArticleMetadata } from '@/providers/firefly/metadata/createFireflyArticleMetadata.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';

export const revalidate = 60;

interface Props
    extends LayoutProps<{ source: SocialSourceInURL }, { s?: SocialSourceInURL; source?: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const params = await props.params;

    // Article metadata: /post/{articleId}?s={source}
    if (searchParams.s && isSocialSourceInUrl(searchParams.s)) {
        const pathname = `/post/${params.source}?s=${searchParams.s}`;
        return createFireflyArticleMetadata(params.source, searchParams.s, pathname);
    }

    // Existing post redirect metadata
    const pathname = `/post/${params.source}?${new URLSearchParams(searchParams as Record<string, string>).toString()}`;
    return searchParams.source && isSocialSourceInUrl(searchParams.source)
        ? createPostMetadata(searchParams.source, params.source, pathname)
        : createSiteMetadata(pathname);
}

export default async function Page(props: Props) {
    setupLocaleFromParams(Locale.en);

    const searchParams = await props.searchParams;
    const params = await props.params;

    // Article handling: /post/{articleId}?s={source}
    if (searchParams.s) {
        const source = searchParams.s;
        const id = params.source;
        // Currently only supports Bsky
        if (source !== SourceInURL.Bsky) notFound();
        // only match firefly post id
        if (!id.startsWith('ff-')) notFound();

        const article = await getArticleById(id);

        if (!article) {
            notFound();
        }
        const postId = article.customPayload?.posts.find((post) => !!post.postId)?.postId;

        if (postId) {
            const postUrl = resolvePostUrl(Source.Bsky, postId);

            if (postUrl) {
                redirect(postUrl);
            }
        } else {
            return (
                <>
                    <header className="border-line bg-primaryBottom sticky top-0 z-40 flex items-center border-b px-4 py-[18px]">
                        <Comeback className="mr-8" />
                        <h2 className="text-xl font-black leading-6">
                            <Trans>Details</Trans>
                        </h2>
                    </header>
                    <article>
                        <ArticleMarkup>{article.content}</ArticleMarkup>
                    </article>
                </>
            );
        }
    }

    // Existing post redirect handling: /post/{postId}?source={source}
    if (!searchParams.source) notFound();
    if (!isSocialSourceInUrl(params.source)) {
        redirect(resolvePostUrl(resolveSocialSource(searchParams.source), params.source));
    }
    notFound();
}
