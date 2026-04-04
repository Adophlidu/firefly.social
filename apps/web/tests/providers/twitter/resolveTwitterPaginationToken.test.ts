import { describe, expect, it } from 'vitest';

import { resolveTwitterPaginationToken } from '@/providers/twitter/resolveTwitterPaginationToken.js';

describe('resolveTwitterPaginationToken', () => {
    it('returns undefined for empty or zero-like first-page cursors', () => {
        expect(resolveTwitterPaginationToken()).toBeUndefined();
        expect(resolveTwitterPaginationToken('')).toBeUndefined();
        expect(resolveTwitterPaginationToken('0')).toBeUndefined();
        expect(resolveTwitterPaginationToken('0x0')).toBeUndefined();
    });

    it('keeps valid twitter pagination tokens intact', () => {
        expect(resolveTwitterPaginationToken('12345')).toBe('12345');
        expect(resolveTwitterPaginationToken('7140dibdnow9c7btw4213')).toBe('7140dibdnow9c7btw4213');
    });
});
