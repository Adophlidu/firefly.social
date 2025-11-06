'use client';

import { memo, useMemo } from 'react';

import { runInSafe } from '@/helpers/runInSafe.js';

interface HighlightedTextProps {
    text: string;
}

function separateTextAndEmoji(text: string): Array<{
    type: 'text' | 'emoji';
    content: string;
}> {
    if (!text) return [];

    const emojiRegex =
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})(?:\u200d\p{Emoji_Presentation}|\p{Extended_Pictographic})*/gu;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = emojiRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const textSegment = text.substring(lastIndex, match.index);
            segments.push({
                type: 'text' as const,
                content: textSegment,
            });
        }

        segments.push({
            type: 'emoji' as const,
            content: match[0],
        });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        segments.push({
            type: 'text' as const,
            content: remainingText,
        });
    }

    return segments;
}

export const HighlightedText = memo<HighlightedTextProps>(function HighlightedText({ text }) {
    const segments = useMemo(() => runInSafe(() => separateTextAndEmoji(text)), [text]);

    if (!segments?.length) return text;

    return (
        <>
            {segments.map((segment, index) =>
                segment.type === 'text' ? (
                    <span key={index} className="gradient-text">
                        {segment.content}
                    </span>
                ) : (
                    <span key={index}>{segment.content}</span>
                ),
            )}
        </>
    );
});
