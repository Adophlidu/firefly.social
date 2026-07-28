/* eslint-disable react-hooks/rules-of-hooks -- slot exports are components, but named after the slot (lowercase) they fill */
import type { SocialSourceInURL } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import { type HeadContext, type LoaderContext, notFound, redirect, useLoaderData } from '@dimensiondev/ssr';
import { Trans } from '@lingui/react/macro';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Comeback } from '@/components/Comeback.js';
import { ArticleMarkup } from '@/components/Markup/ArticleMarkup.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { getFireflyArticlePageMetadata } from '@/providers/firefly/metadata/getFireflyArticlePageMetadata.js';
import type { Article } from '@/providers/types/Article.js';

interface PostSourceLoaderData {
    kind: 'article';
    article: Article;
}

interface PostSourceHeadInput {
    source: string;
    articleSource: string | null;
    legacySource: string | null;
    search: string;
}

/**
 * Legacy redirect route:
 * - `/post/{articleId}?s={source}` — firefly article, redirect to the linked
 *   bsky post when possible
 * - `/post/{postId}?source={source}` — legacy post URL, redirect to the
 *   canonical post URL
 */
export async function loader({ params, url }: LoaderContext): Promise<PostSourceLoaderData> {
    const source = params.source!;
    const articleSource = url.searchParams.get('s');

    // Article handling: /post/{articleId}?s={source}
    if (articleSource) {
        // Currently only supports Bsky
        if (articleSource !== SourceInURL.Bsky) notFound();
        // only match firefly post id
        if (!source.startsWith('ff-')) notFound();

        const article = await getArticleById(source);
        if (!article) notFound();

        const postId = article.customPayload?.posts.find((post) => !!post.postId)?.postId;
        if (postId) {
            const postUrl = resolvePostUrl(Source.Bsky, postId);
            if (postUrl) redirect(postUrl);
        }
        return { kind: 'article', article };
    }

    // Existing post redirect handling: /post/{postId}?source={source}
    const legacySource = url.searchParams.get('source');
    if (!legacySource) notFound();
    if (!isSocialSourceInUrl(source as SocialSourceInURL)) {
        redirect(resolvePostUrl(resolveSocialSource(legacySource as SocialSourceInURL), source));
    }
    notFound();
}

/**
 * The head logic needs the raw search params, which the loader context owns.
 * Recompute them from the same inputs instead of threading them through data:
 * head receives only loader data, so read the request via a second channel —
 * the URL is available on the loader context only, hence we keep the metadata
 * mapping here using the same derivation as the Next generateMetadata.
 */
export async function head({ data, params }: HeadContext) {
    const { article } = (data ?? {}) as Partial<PostSourceLoaderData>;
    const source = params.source ?? '';
    if (article) {
        // /post/{articleId}?s=bsky — only bsky articles reach the page.
        const pathname = `/post/${source}?s=bsky`;
        return fromNextMetadata(await getFireflyArticlePageMetadata(source, SourceInURL.Bsky, pathname));
    }
    return fromNextMetadata(createSiteMetadata(`/post/${source}`));
}

export default function PostSourcePage() {
    const { article } = useLoaderData<PostSourceLoaderData>();
    return (
        <>
            <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
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
