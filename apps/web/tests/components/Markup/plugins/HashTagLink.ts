import { describe, expect, it } from 'vitest';

import { splitTextChildren } from '@/components/Markup/plugins/splitTextChildren.js';

describe('splitTextChildren', () => {
    it('should return a single text node when no match is found', () => {
        const result = splitTextChildren(/#(\w+)/g, 'This is a test');
        expect(result).toEqual([{ type: 'text', value: 'This is a test' }]);
    });

    it('should correctly split text and create link nodes', () => {
        const result = splitTextChildren(/#(\w+)/g, 'This is a #test');
        expect(result).toEqual([
            { type: 'text', value: 'This is a ' },
            { type: 'link', title: '#test', url: '#test', children: [{ type: 'text', value: '#test' }] },
        ]);
    });

    it('should handle multiple matches', () => {
        const result = splitTextChildren(/#(\w+)/g, 'This is a #test and another #example');
        expect(result).toEqual([
            { type: 'text', value: 'This is a ' },
            { type: 'link', title: '#test', url: '#test', children: [{ type: 'text', value: '#test' }] },
            { type: 'text', value: ' and another ' },
            { type: 'link', title: '#example', url: '#example', children: [{ type: 'text', value: '#example' }] },
        ]);
    });

    it('should handle text starting with a match', () => {
        const result = splitTextChildren(/#(\w+)/g, '#test is a tag');
        expect(result).toEqual([
            { type: 'link', title: '#test', url: '#test', children: [{ type: 'text', value: '#test' }] },
            { type: 'text', value: ' is a tag' },
        ]);
    });

    it('should handle text ending with a match', () => {
        const result = splitTextChildren(/#(\w+)/g, 'This is a #test');
        expect(result).toEqual([
            { type: 'text', value: 'This is a ' },
            { type: 'link', title: '#test', url: '#test', children: [{ type: 'text', value: '#test' }] },
        ]);
    });

    it('should handle consecutive matches', () => {
        const result = splitTextChildren(/#(\w+)/g, '#test#example');
        expect(result).toEqual([
            { type: 'link', title: '#test', url: '#test', children: [{ type: 'text', value: '#test' }] },
            { type: 'link', title: '#example', url: '#example', children: [{ type: 'text', value: '#example' }] },
        ]);
    });

    it('should handle text with multiple spaced hashtags', () => {
        const result = splitTextChildren(/#(\w+)/g, 'hello #abc #cde');
        expect(result).toEqual([
            { type: 'text', value: 'hello ' },
            { type: 'link', title: '#abc', url: '#abc', children: [{ type: 'text', value: '#abc' }] },
            { type: 'text', value: ' ' },
            { type: 'link', title: '#cde', url: '#cde', children: [{ type: 'text', value: '#cde' }] },
        ]);
    });
});
