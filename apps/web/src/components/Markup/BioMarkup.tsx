'use client';

import { compact } from 'lodash-es';
import { type HTMLProps, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import linkifyRegex from 'remark-linkify-regex';
import stripMarkdown from 'strip-markdown';

import { Code } from '@/components/Code.js';
import type { MarkupProps } from '@/components/Markup/Markup.js';
import { MarkupLink } from '@/components/Markup/MarkupLink/index.js';
import { DisableItalicPlugin } from '@/components/Markup/plugins/DisableItalicPlugin.js';
import { HashTagLink } from '@/components/Markup/plugins/HashTagLink.js';
import { MentionPlugin } from '@/components/Markup/plugins/MentionPlugin.js';
import { MergeAdjacentTextPlugin } from '@/components/Markup/plugins/MergeAdjacentTextPlugin.js';
import type { SocialSource } from '@/constants/enum.js';
import {
    BIO_TWITTER_PROFILE_REGEX,
    CHANNEL_REGEX,
    EMAIL_REGEX,
    SYMBOL_REGEX,
    TCO_URL_REGEX,
    URL_REGEX,
} from '@/constants/regexp.js';
import { isChannelSupported } from '@/helpers/isChannelSupported.js';
import { trimify } from '@/helpers/trimify.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { Pluggable } from '@/types/utility.js';

interface BioMarkupProps extends MarkupProps {
    source?: SocialSource;
    profile?: Profile;
}

export const BioMarkup = memo<BioMarkupProps>(function BioMarkup({ children, post, source, profile, ...rest }) {
    const bioPlugins = useMemo<Pluggable[]>(() => {
        return compact([
            [stripMarkdown, { keep: ['strong', 'emphasis', 'inlineCode'] }],
            remarkBreaks,
            DisableItalicPlugin,
            MergeAdjacentTextPlugin,
            linkifyRegex(TCO_URL_REGEX), // Make sure tco url is before email which is more aggressive
            linkifyRegex(EMAIL_REGEX),
            linkifyRegex(BIO_TWITTER_PROFILE_REGEX),
            MentionPlugin(source),
            linkifyRegex(URL_REGEX),
            HashTagLink(source),
            linkifyRegex(SYMBOL_REGEX),
            isChannelSupported(source) ? linkifyRegex(CHANNEL_REGEX) : undefined,
        ]);
    }, [source]);

    const LinkComponent = useMemo(() => {
        return function Link(props: HTMLProps<HTMLAnchorElement>) {
            const matched = props.title?.startsWith('@') && props.title.endsWith('.');
            const title = matched ? props.title?.slice(0, -1) : props.title;
            return (
                <>
                    <MarkupLink title={title} post={post} source={source} profile={profile} />
                    {matched ? '.' : null}
                </>
            );
        };
    }, [profile, post, source]);

    if (!children) return null;

    return (
        <ReactMarkdown
            {...rest}
            remarkPlugins={bioPlugins}
            components={{
                a: LinkComponent,
                code: Code,
                ...rest.components,
            }}
        >
            {trimify(children)}
        </ReactMarkdown>
    );
});
