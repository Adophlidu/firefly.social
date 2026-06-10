import { describe, expect, test } from 'vitest';

import { resolveXReplyUrl } from '@/helpers/resolveXReplyUrl.js';

describe('resolveXReplyUrl', () => {
    test('builds the X intent reply url for a tweet id', () => {
        expect(resolveXReplyUrl('1234567890')).toBe('https://x.com/intent/tweet?in_reply_to=1234567890');
    });

    test('returns an empty string when the tweet id is missing', () => {
        expect(resolveXReplyUrl('')).toBe('');
    });
});
