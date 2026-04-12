'use client';

import { compact } from 'lodash-es';
import { type DetailedHTMLProps, memo, type OlHTMLAttributes, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import linkifyRegex from 'remark-linkify-regex';
import stripMarkdown from 'strip-markdown';

import { Code } from '@/components/Code.js';
import type { MarkupProps } from '@/components/Markup/Markup.js';
import { MarkupLink } from '@/components/Markup/MarkupLink/index.js';
import { HashTagLink } from '@/components/Markup/plugins/HashTagLink.js';
import { UrlPlugin } from '@/components/Markup/plugins/UrlPlugin.js';
import { CHANNEL_REGEX } from '@/constants/regexp.js';
import { isChannelSupported } from '@/helpers/isChannelSupported.js';
import type { Pluggable } from '@/types/utility.js';

const trimify = (value: string): string => value.replace(/\n\n\s*\n/g, '\n\n').trim();

function Ol(props: DetailedHTMLProps<OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>) {
    return <ol {...props} style={{ counterReset: `list-counter ${props.start ? props.start - 1 : ''}` }} />;
}

const Markup = memo<MarkupProps>(function Markup({ children, post, ...rest }) {
    const plugins = useMemo<Pluggable[]>(() => {
        if (!post?.mentions?.length)
            return compact([
                [stripMarkdown, { keep: ['strong', 'emphasis', 'inlineCode', 'list', 'listItem'] }],
                remarkBreaks,
                UrlPlugin,
                isChannelSupported(post?.source) ? linkifyRegex(CHANNEL_REGEX) : undefined,
                HashTagLink(post?.source),
            ]);
        const handles = post.mentions.map((x) => x.fullHandle);
        const mentionRe = new RegExp(`@(${handles.join('|')})`, 'g');
        return compact([
            [stripMarkdown, { keep: ['strong', 'emphasis', 'inlineCode', 'list', 'listItem'] }],
            remarkBreaks,
            // Make sure Mention plugin is before URL plugin, to avoid matching
            // mentioned ens handle as url. For example, @mask.eth should be treat
            // as a mention rather than link
            linkifyRegex(mentionRe),
            UrlPlugin,
            isChannelSupported(post.source) ? linkifyRegex(CHANNEL_REGEX) : undefined,
            HashTagLink(post.source),
        ]);
    }, [post?.mentions, post?.source]);

    if (!children) return null;

    return (
        <ReactMarkdown
            {...rest}
            remarkPlugins={plugins}
            components={{
                // eslint-disable-next-line react/no-unstable-nested-components
                a: (props) => <MarkupLink title={props.title} post={post} source={post?.source} />,
                ol: Ol,
                code: Code,
                ...rest.components,
            }}
        >
            {trimify(children)}
        </ReactMarkdown>
    );
});

// Render without tags, but leave <br/> and <p/> to keep paragraphs
const allowedElements = ['br', 'p', 'a'];

export function NakedMarkup(props: MarkupProps) {
    return <Markup {...props} allowedElements={allowedElements} unwrapDisallowed />;
}
