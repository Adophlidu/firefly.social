'use client';

import '@/styles/limo.css';
import '@/styles/paragraph.css';
import '@/styles/matters.css';

import { ArticlePlatform, AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { useCallback } from 'react';

import { ArticleHeader } from '@/components/Article/ArticleHeader.js';
import { Comeback } from '@/components/Comeback.js';
import { SanitizerDiv } from '@/components/DomPurify.js';
import { Link } from '@/components/Link.js';
import { ArticleMarkup } from '@/components/Markup/ArticleMarkup.js';
import { CollapsedContent } from '@/components/Posts/CollapsedContent.js';
import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { openAndWaitForCloseConfirmLeavingModal } from '@/controllers/openConfirmLeavingModal.js';
import { openPreviewMediaModal } from '@/controllers/openPreviewMediaModal.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import { captureArticleViewSourceClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { Article } from '@/providers/types/Article.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

interface ArticleDetailContentProps {
    article: Article;
    cover: string | null;
}

export function ArticleDetailContent({ article, cover }: ArticleDetailContentProps) {
    const isDarkMode = useIsDarkMode();
    const isMuted = useIsProfileMuted(Source.Wallet, article.author.id, article.author.isMuted);
    const articleOrigin = article.origin;
    const identity = useFireflyIdentity(Source.Wallet, article.author.id);

    const handleViewSourceClick = useCallback(() => {
        captureArticleViewSourceClickEvent(article.id, identity.id);
    }, [article.id, identity.id]);

    return (
        <div className="min-h-screen">
            <div className="sticky top-0 z-40 flex items-center bg-primaryBottom px-4 py-[18px]">
                <Comeback className="mr-8" />
                <h2 className="text-xl font-black leading-6">
                    <Trans>Details</Trans>
                </h2>
            </div>

            <div className="px-4">
                {cover && !isMuted ? (
                    <ImageAsset
                        src={cover}
                        width={510}
                        height={260}
                        priority
                        className="mb-3 w-full cursor-pointer rounded-lg object-cover"
                        alt={cover}
                        onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            if (cover)
                                openPreviewMediaModal({
                                    medias: [{ type: AttachmentType.Image, uri: cover }],
                                    index: 0,
                                    source: Source.Article,
                                });
                        }}
                    />
                ) : null}
                {!isMuted ? <div className="line-clamp-5 text-2xl font-semibold">{article.title}</div> : null}
                <div className="my-5 mt-2 border-b border-line">
                    <ArticleHeader article={article} className="items-center pb-2" />
                </div>
                {isMuted ? (
                    <CollapsedContent className="mt-2" authorMuted isQuote={false} />
                ) : article.platform !== ArticlePlatform.Mirror ? (
                    <div
                        className={classNames({
                            'limo-article': article.platform === ArticlePlatform.Limo,
                            'paragraph-article': article.platform === ArticlePlatform.Paragraph,
                            'matters-article': article.platform === ArticlePlatform.Matters,
                        })}
                    >
                        {/*  The content returned by limo, paragraph, and matters is html. */}
                        <SanitizerDiv
                            className={classNames('markdown-body comment-enabled', {
                                dark: isDarkMode,
                            })}
                            dangerouslySetInnerHTML={{
                                __html:
                                    article.platform === ArticlePlatform.Matters
                                        ? (article.htmlContent ?? article.content)
                                        : article.content,
                            }}
                            onClick={async (event) => {
                                event.stopPropagation();
                                event.preventDefault();

                                const anchorEl = (event.target as HTMLElement).closest('a');
                                if (anchorEl) {
                                    if (anchorEl.href) {
                                        const isTrusted = isTrustedUrl(anchorEl.href);
                                        if (!isTrusted) {
                                            const intercepted = await interceptExternalUrl(anchorEl.href);
                                            if (intercepted) return;
                                            const confirmed = await openAndWaitForCloseConfirmLeavingModal(
                                                anchorEl.href,
                                            );
                                            if (confirmed) openWindow(anchorEl.href);
                                        }

                                        return;
                                    }
                                }

                                if ((event.target as HTMLElement).tagName !== 'IMG') return;

                                const image = event.target as HTMLImageElement;

                                if (!image.classList.contains('embed') && !image.classList.contains('zora-embed'))
                                    return;

                                const nodes = event.currentTarget.querySelectorAll('.embed, .zora-embed');
                                const medias = compact(
                                    [...nodes.values()].map((x) => {
                                        const src = x.getAttribute('src');
                                        if (!src) return;
                                        return {
                                            type: AttachmentType.Image,
                                            uri: src,
                                        };
                                    }),
                                ) as Attachment[];

                                const index = medias.findIndex((x) => image.src === x.uri);

                                openPreviewMediaModal({
                                    index: Math.max(index, 0),
                                    medias,
                                    source: Source.Article,
                                });
                            }}
                        />
                    </div>
                ) : (
                    <ArticleMarkup
                        linkProps={{ sourceLink: article.origin }}
                        className="markup linkify break-words text-medium"
                        imageProps={{ disableLoadHandler: true, style: { objectFit: 'cover' } }}
                    >
                        {article.content}
                    </ArticleMarkup>
                )}
                <div className="mt-1 flex items-center gap-2">
                    {articleOrigin ? (
                        <Link
                            href={articleOrigin}
                            className="flex items-center gap-1 text-xs text-link hover:underline"
                            rel="noreferrer noopener"
                            target="_blank"
                            onClick={handleViewSourceClick}
                        >
                            <Trans>View Source</Trans>
                        </Link>
                    ) : null}
                </div>
                {/* article bottom padding */}
                <div className="py-4" />
            </div>
        </div>
    );
}
