'use client';

import '@/styles/limo.css';
import '@/styles/paragraph.css';

import { ArticlePlatform, AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';

import { ArticleActions } from '@/components/Article/ArticleActions.js';
import { ArticleAuthor } from '@/components/Article/ArticleAuthor.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { SanitizerDiv } from '@/components/DomPurify.js';
import { ArticleMarkup } from '@/components/Markup/ArticleMarkup.js';
import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { PreviewMediaModalRef } from '@/modals/PreviewMediaModal/refs.js';
import type { Article } from '@/providers/types/Article.js';

interface Props {
    cover?: string;
    article: Article;
    onClick?: () => void;
}

export function ArticleBody({ cover, article, onClick }: Props) {
    const isMedium = useIsMedium();

    const isDarkMode = useIsDarkMode();

    return (
        <ClickableArea
            as="article"
            onClick={onClick}
            className={classNames(
                'relative mt-[6px] flex flex-col gap-2 rounded-2xl border border-secondaryLine bg-bg p-3 text-left text-main',
                {
                    'overflow-hidden': !!article.content,
                },
            )}
        >
            {cover ? (
                <ImageAsset
                    disableLoadHandler
                    src={cover}
                    width={510}
                    height={260}
                    className="mb-3 max-h-[260px] w-full cursor-pointer rounded-lg object-cover"
                    alt={cover}
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();

                        if (cover)
                            PreviewMediaModalRef.open({
                                medias: [{ type: AttachmentType.Image, uri: cover }],
                                index: 0,
                                source: Source.Article,
                            });
                    }}
                />
            ) : null}
            <h1
                className={classNames('line-clamp-2 text-left text-[18px] font-bold leading-5', {
                    'max-h-[40px]': IS_SAFARI && IS_APPLE,
                })}
            >
                {article.title}
            </h1>
            <div className="flex min-w-0 items-center justify-between border-b border-secondaryLine pb-[10px]">
                <ArticleAuthor className="min-w-0" article={article} />
                {isMedium ? <ArticleActions article={article} /> : null}
            </div>
            {article.content ? (
                <div className="h-[100px]">
                    {article.platform !== ArticlePlatform.Mirror ? (
                        <div
                            className={classNames({
                                'limo-article': article.platform === ArticlePlatform.Limo,
                                'paragraph-article': article.platform === ArticlePlatform.Paragraph,
                            })}
                        >
                            {/*  The content returned by limo is html. */}
                            <SanitizerDiv
                                className={classNames('markdown-body comment-enabled', {
                                    dark: isDarkMode,
                                })}
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        </div>
                    ) : (
                        <ArticleMarkup disableImage className="markup break-words text-sm leading-[18px] text-second">
                            {article.content}
                        </ArticleMarkup>
                    )}
                    <div
                        className="absolute bottom-0 left-0 h-[100px] w-full"
                        style={{
                            background: `linear-gradient(
                            to top,
                            rgba(var(--background-end-rgb), 1) 0%,
                            rgba(var(--background-end-rgb), 0.3) 50%,
                            rgba(var(--background-end-rgb), 0.15) 65%,
                            rgba(var(--background-end-rgb), 0.075) 75.5%,
                            rgba(var(--background-end-rgb), 0.037) 82.85%,
                            rgba(var(--background-end-rgb), 0.019) 88%,
                            rgba(var(--background-end-rgb), 0) 100%
                          )`,
                        }}
                    />
                </div>
            ) : null}
        </ClickableArea>
    );
}
