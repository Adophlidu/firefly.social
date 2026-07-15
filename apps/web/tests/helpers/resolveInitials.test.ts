import { describe, expect, it } from 'vitest';

import { resolveInitials } from '@/helpers/resolveInitials.js';

describe('resolveInitials', () => {
    it('takes the first initial of the first two words in upper case', () => {
        expect(resolveInitials('alice wonderland')).toBe('AW');
    });

    it('handles a single word', () => {
        expect(resolveInitials('bob')).toBe('B');
    });

    it('ignores surrounding and repeated whitespace', () => {
        expect(resolveInitials('  charlie   david  ')).toBe('CD');
    });

    it('caps at two initials', () => {
        expect(resolveInitials('a b c d')).toBe('AB');
    });

    it('returns an empty string for empty input', () => {
        expect(resolveInitials('')).toBe('');
    });
});
