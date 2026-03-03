'use client';

import { memo } from 'react';
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import linkifyRegex from 'remark-linkify-regex';
import stripMarkdown from 'strip-markdown';

import { Code } from '@/components/Code.js';
import { ExternalLink } from '@/components/Markup/MarkupLink/ExternalLink.js';
import { DisableItalicPlugin } from '@/components/Markup/plugins/DisableItalicPlugin.js';
import { HashTagLink } from '@/components/Markup/plugins/HashTagLink.js';
import { MentionPlugin } from '@/components/Markup/plugins/MentionPlugin.js';
import { MergeAdjacentTextPlugin } from '@/components/Markup/plugins/MergeAdjacentTextPlugin.js';
import { BIO_TWITTER_PROFILE_REGEX, EMAIL_REGEX, SYMBOL_REGEX, TCO_URL_REGEX, URL_REGEX } from '@/constants/regexp.js';
import { trimify } from '@/helpers/trimify.js';
import { type Pluggable } from '@/types/utility.js';

interface PredictionDescriptionProps extends Omit<ReactMarkdownOptions, 'children'> {
    children?: ReactMarkdownOptions['children'] | null;
}

const plugins: Pluggable[] = [
    [stripMarkdown, { keep: ['strong', 'emphasis', 'inlineCode'] }],
    remarkBreaks,
    DisableItalicPlugin,
    MergeAdjacentTextPlugin,
    linkifyRegex(TCO_URL_REGEX), // Make sure tco url is before email which is more aggressive
    linkifyRegex(EMAIL_REGEX),
    linkifyRegex(BIO_TWITTER_PROFILE_REGEX),
    MentionPlugin(),
    linkifyRegex(URL_REGEX),
    HashTagLink(),
    linkifyRegex(SYMBOL_REGEX),
];

export const PredictionDescription = memo<PredictionDescriptionProps>(function PredictionDescription({
    children,
    ...rest
}) {
    if (!children) return null;

    return (
        <ReactMarkdown
            {...rest}
            remarkPlugins={plugins}
            components={{
                // eslint-disable-next-line react/no-unstable-nested-components
                a: (props) => <ExternalLink {...props} title={props.title || ''} />,
                code: Code,
                ...rest.components,
            }}
        >
            {trimify(children)}
        </ReactMarkdown>
    );
});
