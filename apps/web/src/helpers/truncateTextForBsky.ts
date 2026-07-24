import { BSKY_SHORT_POST_LIMIT } from '@/constants/limitation.js';
import { BSKY_MENTION_REGEX, URL_REGEX } from '@/constants/regexp.js';

// Reserved characters for newlines and spacing
const RESERVED_CHARS = 5;
// Ellipsis character
const ELLIPSIS = '…';

// Punctuation marks and spaces where we can safely break
const BREAK_CHARS = /[\s,.;:!?。，、；：！？\n]/;

function findTruncatePosition(text: string, maxLength: number): number {
    if (text.length <= maxLength) {
        return text.length;
    }

    const windowSize = 50;
    const searchStart = Math.max(0, maxLength - windowSize);

    const isInsideUrl = (pos: number) =>
        Array.from(text.matchAll(URL_REGEX)).some((match) => {
            const start = match.index!;
            const end = start + match[0].length;
            return pos >= start && pos < end;
        });
    const isInsideMention = (pos: number) =>
        Array.from(text.matchAll(BSKY_MENTION_REGEX)).some((match) => {
            const start = match.index!;
            const end = start + match[0].length;
            return pos >= start && pos < end;
        });
    const positions = Array.from({ length: maxLength - searchStart + 1 }, (_, i) => maxLength - i);

    const safePosition = positions.find(
        (pos) => BREAK_CHARS.test(text[pos]) && !isInsideUrl(pos) && !isInsideMention(pos),
    );

    return safePosition ?? maxLength;
}

export function truncateTextForBsky(text: string, longPostUrl: string): string {
    if (!text || !longPostUrl) {
        return text || '';
    }

    const urlLength = longPostUrl.length;
    const ellipsisLength = ELLIPSIS.length;
    const newlineLength = 2; // "\n\n"

    const maxTextLength = BSKY_SHORT_POST_LIMIT - urlLength - ellipsisLength - newlineLength - RESERVED_CHARS;

    if (maxTextLength <= 0) {
        // No room left for any text alongside the link — keep the link so the post stays reachable.
        return longPostUrl;
    }

    if (text.length <= maxTextLength) {
        return `${text}\n\n${longPostUrl}`;
    }

    const truncatePosition = findTruncatePosition(text, maxTextLength);

    let truncatedText = text.substring(0, truncatePosition).trim();

    truncatedText = truncatedText.replace(/[,.;:!?。，、；：！？]+$/, '');

    return `${truncatedText}${ELLIPSIS}\n\n${longPostUrl}`;
}
