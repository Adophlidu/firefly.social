import { describe, expect, it } from 'vitest';

import { splitAddressForHighlight } from '@/helpers/deposit/splitAddressForHighlight';

describe('splitAddressForHighlight', () => {
    it('splits a long EVM address into head/middle/tail of the default size 6', () => {
        const address = '0x1234567890abcdef1234567890abcdef12345678';
        const { head, middle, tail } = splitAddressForHighlight(address);
        expect(head).toBe('0x1234');
        expect(tail).toBe('345678');
        expect(middle).toBe(address.slice(6, -6));
        expect(`${head}${middle}${tail}`).toBe(address);
    });

    it('returns the whole address as head when it is shorter than size*2', () => {
        const address = '0x1234';
        const segments = splitAddressForHighlight(address);
        expect(segments).toEqual({ head: address, middle: '', tail: '' });
    });

    it('treats the boundary (length === size*2) as too short to highlight a middle', () => {
        // 12 chars === 6*2 → no middle
        const address = '0x1234567890';
        expect(address.length).toBeLessThanOrEqual(12);
        const segments = splitAddressForHighlight('abcdef');
        expect(segments).toEqual({ head: 'abcdef', middle: '', tail: '' });
    });

    it('honours a custom size', () => {
        const address = '0x1234567890abcdef';
        const segments = splitAddressForHighlight(address, 4);
        expect(segments.head).toBe('0x12');
        expect(segments.tail).toBe('cdef');
    });

    it('treats non-positive size as no-highlight', () => {
        const address = '0x1234567890abcdef';
        const segments = splitAddressForHighlight(address, 0);
        expect(segments).toEqual({ head: address, middle: '', tail: '' });
    });
});
