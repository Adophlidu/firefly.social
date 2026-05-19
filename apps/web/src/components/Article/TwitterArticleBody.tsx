import { AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { ArticleMarkup } from '@/components/Markup/ArticleMarkup.js';
import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { TWITTER_ARTICLE_REGEX } from '@/constants/regexp.js';
import { PreviewMediaModalRef } from '@/modals/PreviewMediaModal/refs.js';

interface Props {
    cover?: string;
    title: string;
    content?: string;
    oembedUrls?: string[];
}

export function TwitterArticleBody({ cover, title, content, oembedUrls }: Props) {
    const articleUrl = useMemo(() => {
        return oembedUrls?.find((url) => TWITTER_ARTICLE_REGEX.test(url));
    }, [oembedUrls]);

    const body = (
        <article className="border-line bg-bg text-main relative mt-[6px] flex flex-col gap-2 overflow-hidden rounded-2xl border p-3 text-left">
            {cover ? (
                <ImageAsset
                    disableLoadHandler
                    src={cover}
                    width={510}
                    height={260}
                    className="mb-3 w-full cursor-pointer rounded-lg object-cover"
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
            <div
                className={classNames('line-clamp-2 text-base font-bold leading-5', {
                    'max-h-[40px]': IS_SAFARI && IS_APPLE,
                })}
            >
                {title}
            </div>
            {content ? (
                <div className="h-[100px]">
                    <ArticleMarkup disableImage className="markup text-second break-words text-sm leading-[18px]">
                        {content}
                    </ArticleMarkup>
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
        </article>
    );

    if (articleUrl) {
        return (
            <Link href={articleUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                {body}
            </Link>
        );
    }

    return body;
}
