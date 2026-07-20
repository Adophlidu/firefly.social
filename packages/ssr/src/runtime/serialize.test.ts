import { describe, expect, it } from 'vitest';

import { parseSsrPayload, serializeForHtml } from './serialize.ts';

describe('serializeForHtml', () => {
    it('escapes angle brackets so user data cannot break out of the script tag', () => {
        const json = serializeForHtml({ html: '</script><script>alert(1)</script>' });
        expect(json).not.toContain('</script>');
        expect(json).toContain('\\u003c');
    });

    it('round-trips through JSON.parse', () => {
        const value = { url: '/posts/1', params: { id: '1' }, data: { '/': { n: 42 } } };
        expect(parseSsrPayload(serializeForHtml(value))).toEqual(value);
    });
});
