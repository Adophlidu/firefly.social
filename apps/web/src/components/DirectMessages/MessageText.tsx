'use client';

import { memo, type ReactNode } from 'react';

import { ExternalLink } from '@/components/Markup/MarkupLink/ExternalLink.js';
import { URL_REGEX } from '@/constants/regexp.js';

interface MessageTextProps {
    content: string;
    isSelf?: boolean;
}

function linkifyMessageText(content: string, isSelf: boolean): ReactNode[] {
    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of content.matchAll(URL_REGEX)) {
        const url = match[0];
        const index = match.index;
        if (!url || content[index - 1] === '@') continue;

        if (index > cursor) nodes.push(content.slice(cursor, index));
        nodes.push(
            <ExternalLink
                key={`${index}-${url}`}
                title={url}
                className={isSelf ? 'font-semibold !text-white underline decoration-2 underline-offset-2' : undefined}
                showExternalIcon={isSelf}
            />,
        );
        cursor = index + url.length;
    }

    if (cursor < content.length) nodes.push(content.slice(cursor));
    return nodes;
}

export const MessageText = memo(function MessageText({ content, isSelf = false }: MessageTextProps) {
    return linkifyMessageText(content, isSelf);
});
