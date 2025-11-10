'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, useRef } from 'react';
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import linkifyRegex from 'remark-linkify-regex';
import stripMarkdown from 'strip-markdown';

import { Code } from '@/components/Code.js';
import { MarkupLink } from '@/components/Markup/MarkupLink/index.js';
import type { MarkupLinkProps } from '@/components/Markup/MarkupLink/type.js';
import { NFTPlugin } from '@/components/Markup/plugins/NFT.js';
import { ImageAsset, type ImageAssetProps } from '@/components/Posts/ImageAsset.js';
import { Source } from '@/constants/enum.js';
import { BIO_TWITTER_PROFILE_REGEX, EMAIL_REGEX, URL_REGEX } from '@/constants/regexp.js';
import { trimify } from '@/helpers/trimify.js';
import { PreviewMediaModalRef } from '@/modals/PreviewMediaModal/PreviewMediaModal.js';
import type { Pluggable } from '@/types/utility.js';

const PLUGINS: Pluggable[] = [
    [stripMarkdown, { keep: ['strong', 'emphasis', 'inlineCode', 'image'] }],
    remarkBreaks,
    linkifyRegex(EMAIL_REGEX),
    linkifyRegex(BIO_TWITTER_PROFILE_REGEX),
    linkifyRegex(URL_REGEX),
    NFTPlugin(),
];

interface ArticleMarkupProps extends Omit<ReactMarkdownOptions, 'children'> {
    children: ReactMarkdownOptions['children'] | null;
    disableImage?: boolean;
    imageProps?: Partial<ImageAssetProps>;
    linkProps?: Partial<MarkupLinkProps>;
}

export const ArticleMarkup = memo<ArticleMarkupProps>(function ArticleMarkup({
    children,
    disableImage,
    imageProps,
    linkProps,
    ...rest
}) {
    const images = useRef<string[]>([]);
    if (!children) return null;

    return (
        <ReactMarkdown
            {...rest}
            remarkPlugins={PLUGINS}
            components={{
                // eslint-disable-next-line react/no-unstable-nested-components
                a: (props) => <MarkupLink title={props.title} {...linkProps} />,
                code: Code,
                // eslint-disable-next-line react/no-unstable-nested-components
                img: (props) => {
                    if (!props.src || disableImage) return null;
                    const src = props.src as string; // FIXME: blob URL issue
                    images.current = !images.current.includes(src) ? [...images.current, src] : images.current;
                    const index = images.current.findIndex((uri) => uri === src);
                    return (
                        <ImageAsset
                            className={classNames('cursor-pointer', props.className)}
                            src={src}
                            alt={src}
                            width={1000}
                            height={1000}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!src) return;
                                PreviewMediaModalRef.open({
                                    index: Math.max(index, 0),
                                    medias: images.current.map((uri) => ({ type: 'Image', uri })),
                                    source: Source.Article,
                                });
                            }}
                            {...imageProps}
                            style={{
                                width: 'auto',
                                height: 'auto',
                                maxWidth: '100%',
                                ...imageProps?.style,
                            }}
                        />
                    );
                },
                ...rest.components,
            }}
        >
            {trimify(children)}
        </ReactMarkdown>
    );
});
