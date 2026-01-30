import { describe, expect, it } from 'vitest';

import { truncateDecimal } from '@/helpers/truncateDecimal.js';

describe('truncateDecimal', () => {
    const testCases = [
        { value: 123.456789, precision: 2, expected: '123.45' },
        { value: '123.456789', precision: 3, expected: '123.456' },
        { value: 0.1, precision: 2, expected: '0.1' },
        { value: 0.01, precision: 2, expected: '0.01' },
        { value: 0.010001, precision: 2, expected: '0.01' },

        { value: 0.009999, precision: 2, expected: '< 0.01' },
        { value: '0.005', precision: 3, expected: '< 0.01' },
        { value: 0.0001, precision: 4, expected: '< 0.01' },

        { value: 123, precision: 2, expected: '123' },
        { value: '456', precision: 3, expected: '456' },
        { value: 0, precision: 2, expected: '0.00' },
        { value: 0, precision: 0, expected: '0' },

        { value: 123.4, precision: 3, expected: '123.4' },
        { value: 123.45, precision: 5, expected: '123.45' },
        { value: 0.5, precision: 3, expected: '0.5' },

        { value: -0.009999, precision: 2, expected: '< 0.01' },
        { value: -0.01, precision: 2, expected: '-0.01' },
        { value: -0.011, precision: 2, expected: '-0.01' },
        { value: -123, precision: 2, expected: '-123' },
        { value: -123.4, precision: 3, expected: '-123.4' },

        { value: 123.456, precision: 0, expected: '123' },
        { value: 123.999, precision: 0, expected: '123' },
        { value: 123.0, precision: 0, expected: '123' },

        { value: 0.009999999, precision: 6, expected: '< 0.01' },
        { value: 0.009, precision: 3, expected: '< 0.01' },
        { value: 123.0, precision: 2, expected: '123' },
        { value: 123.001, precision: 2, expected: '123' },
    ];

    testCases.forEach(({ value, precision, expected }) => {
        it(`truncates ${value} to ${precision} decimal places`, () => {
            expect(truncateDecimal(value, precision)).toBe(expected);
        });
    });
});
