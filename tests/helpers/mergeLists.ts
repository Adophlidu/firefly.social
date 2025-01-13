import { describe, expect, test } from 'vitest';

import { mergeLists } from '@/helpers/mergeLists.js';

describe('mergeLists', () => {
    test('should merge two lists with equal lengths', () => {
        const list1 = [1, 2, 3];
        const list2 = [4, 5, 6];
        expect(mergeLists(list1, list2)).toEqual([1, 4, 2, 5, 3, 6]);
    });

    test('should merge two lists where one is longer', () => {
        const list1 = [1, 2];
        const list2 = [3, 4, 5, 6];
        expect(mergeLists(list1, list2)).toEqual([1, 3, 2, 4, 5, 6]);
    });

    test('should merge multiple lists with varying lengths', () => {
        const list1 = [1];
        const list2 = [2, 3];
        const list3 = [4, 5, 6];
        expect(mergeLists(list1, list2, list3)).toEqual([1, 2, 4, 3, 5, 6]);
    });

    test('should handle empty lists', () => {
        const list1: number[] = [];
        const list2 = [1, 2, 3];
        expect(mergeLists(list1, list2)).toEqual([1, 2, 3]);
    });

    test('should handle all lists being empty', () => {
        const list1: number[] = [];
        const list2: number[] = [];
        const list3: number[] = [];
        expect(mergeLists(list1, list2, list3)).toEqual([]);
    });

    test('should handle a single list', () => {
        const list1 = [1, 2, 3];
        expect(mergeLists(list1)).toEqual([1, 2, 3]);
    });

    test('should handle no input lists', () => {
        expect(mergeLists()).toEqual([]);
    });
});
