import { describe, expect, it } from 'vitest';

import { MATCHERS } from '@/components/Lexical/plugins/AutoLinkPlugin.js';
import { LINK_MARK_RE } from '@/constants/linkRegExp.js';

/** First non-null matcher wins (mirrors Lexical's findFirstMatch). LINK_MARK_RE is /g, so reset lastIndex. */
function findFirstMatch(text: string) {
    LINK_MARK_RE.lastIndex = 0;

    for (const matcher of MATCHERS) {
        const match = matcher(text);
        if (match) return match;
    }

    return null;
}

describe('AutoLinkPlugin MATCHERS', () => {
    describe('URLs and emails still auto-link (unchanged behavior)', () => {
        it.each(['https://example.com', 'example.com', 'https://example.com/path?q=1'])('links %s as a URL', (text) => {
            const match = findFirstMatch(text);

            expect(match).not.toBeNull();
            expect(match?.url).toBeTruthy();
            expect(match?.url).not.toBe('');
        });

        it.each([
            ['foo@bar.com', 'mailto:foo@bar.com'],
            ['a.b@c.d.com', 'mailto:a.b@c.d.com'],
        ])('links %s as an email', (text, url) => {
            const match = findFirstMatch(text);

            expect(match).not.toBeNull();
            expect(match?.url).toBe(url);
        });
    });

    // @-mentions are highlighted as auto-links; the picker still coexists (see getMentionOriginalText).
    describe('@-mentions are highlighted as auto-links', () => {
        it.each(['@vitalik', '@vitalik.eth', '@name.lens', 'hello @vitalik'])('links %s', (text) => {
            const match = findFirstMatch(text);

            expect(match).not.toBeNull();
        });
    });
});
