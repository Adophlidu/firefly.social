import { describe, expect, test } from 'vitest';

import { classNames } from '../classNames';

describe('classNames', () => {
    describe('basic functionality', () => {
        test('should return empty string when no arguments provided', () => {
            expect(classNames()).toBe('');
        });

        test('should handle single string argument', () => {
            expect(classNames('btn')).toBe('btn');
        });

        test('should handle multiple string arguments', () => {
            expect(classNames('btn', 'primary', 'large')).toBe('btn primary large');
        });

        test('should handle single object argument', () => {
            expect(
                classNames({
                    btn: true,
                    primary: false,
                    large: true,
                }),
            ).toBe('btn large');
        });

        test('should handle multiple object arguments', () => {
            expect(classNames({ btn: true, disabled: false }, { primary: true, large: false })).toBe('btn primary');
        });
    });

    describe('null and undefined handling', () => {
        test('should ignore null values', () => {
            expect(classNames('btn', null, 'primary')).toBe('btn primary');
        });

        test('should ignore undefined values', () => {
            expect(classNames('btn', undefined, 'primary')).toBe('btn primary');
        });

        test('should handle all null/undefined arguments', () => {
            expect(classNames(null, undefined, null)).toBe('');
        });
    });

    describe('mixed arguments', () => {
        test('should handle combination of strings, objects, null, and undefined', () => {
            expect(
                classNames('btn', { primary: true, disabled: false }, null, 'large', undefined, { rounded: true }),
            ).toBe('btn primary large rounded');
        });

        test('should maintain order of classes', () => {
            expect(classNames('first', { second: true, third: false, fourth: true }, 'fifth')).toBe(
                'first second fourth fifth',
            );
        });
    });

    describe('edge cases', () => {
        test('should handle empty strings', () => {
            expect(classNames('', 'btn', '')).toBe('btn');
        });

        test('should handle empty object', () => {
            expect(classNames({})).toBe('');
        });

        test('should handle object with all false values', () => {
            expect(
                classNames({
                    btn: false,
                    primary: false,
                    large: false,
                }),
            ).toBe('');
        });

        test('should handle strings with spaces', () => {
            expect(classNames('btn primary', 'large rounded')).toBe('btn primary large rounded');
        });

        test('should handle falsy values in object', () => {
            expect(
                classNames({
                    btn: true,
                    primary: false,
                    large: 0 as unknown as boolean,
                    rounded: '' as unknown as boolean,
                    disabled: null as unknown as boolean,
                    active: undefined as unknown as boolean,
                    visible: 'truthy' as unknown as boolean,
                    count: 42 as unknown as boolean,
                } as Record<string, boolean>),
            ).toBe('btn visible count');
        });
    });

    describe('complex scenarios', () => {
        test('should handle conditional styling pattern', () => {
            const isActive = true;
            const isDisabled = false;
            const size = 'large';

            expect(
                classNames('btn', `btn-${size}`, {
                    'btn-active': isActive,
                    'btn-disabled': isDisabled,
                }),
            ).toBe('btn btn-large btn-active');
        });

        test('should handle component state styling', () => {
            const state = {
                loading: false,
                error: true,
                success: false,
            };

            expect(
                classNames('form-input', {
                    loading: state.loading,
                    error: state.error,
                    success: state.success,
                }),
            ).toBe('form-input error');
        });

        test('should handle responsive classes', () => {
            const breakpoints = {
                sm: true,
                md: false,
                lg: true,
            };

            expect(
                classNames('grid', {
                    'grid-cols-1': breakpoints.sm,
                    'sm:grid-cols-2': breakpoints.md,
                    'lg:grid-cols-3': breakpoints.lg,
                }),
            ).toBe('grid grid-cols-1 lg:grid-cols-3');
        });
    });

    describe('type safety and robustness', () => {
        test('should handle numeric keys in objects', () => {
            expect(
                classNames({
                    'class-1': true,
                    'class-2': false,
                    'class-3': true,
                }),
            ).toBe('class-1 class-3');
        });

        test('should handle special characters in class names', () => {
            expect(
                classNames({
                    btn_primary: true,
                    'btn-large': true,
                    'btn.rounded': false,
                    'btn@media': true,
                }),
            ).toBe('btn_primary btn-large btn@media');
        });
    });

    describe('performance characteristics', () => {
        test('should handle large number of arguments efficiently', () => {
            const args: Array<string | Record<string, boolean>> = [];

            // Add 10 string arguments (reduced for easier testing)
            for (let i = 0; i < 10; i++) {
                args.push(`class-${i}`);
            }

            // Add 10 object arguments where even indexes are true
            for (let i = 0; i < 10; i++) {
                args.push({ [`obj-class-${i}`]: i % 2 === 0 });
            }

            const result = classNames(...args);
            const classes = result.split(' ');

            // Should include all string classes (10) plus even-indexed object classes (5)
            expect(classes).toHaveLength(15);
            expect(result).toContain('class-0');
            expect(result).toContain('class-9');
            expect(result).toContain('obj-class-0'); // 0 % 2 === 0 → true
            expect(result).toContain('obj-class-2'); // 2 % 2 === 0 → true
            expect(result).toContain('obj-class-8'); // 8 % 2 === 0 → true
            expect(result).not.toContain('obj-class-1'); // 1 % 2 === 0 → false
            expect(result).not.toContain('obj-class-3'); // 3 % 2 === 0 → false
        });

        test('should handle objects with many properties', () => {
            const largeObject: Record<string, boolean> = {};

            for (let i = 0; i < 1000; i++) {
                largeObject[`class-${i}`] = i % 3 === 0;
            }

            const result = classNames(largeObject);
            const classes = result.split(' ');

            // Should include only classes where i % 3 === 0
            expect(classes).toContain('class-0');
            expect(classes).toContain('class-3');
            expect(classes).toContain('class-999');
            expect(classes).not.toContain('class-1');
            expect(classes).not.toContain('class-2');
        });
    });

    describe('code coverage validation', () => {
        test('should exercise all code paths', () => {
            // Test all branches and conditions
            const result = classNames(
                null,
                undefined,
                '',
                'valid-string',
                {},
                { 'true-class': true },
                { 'false-class': false },
                { 'multi-true': true, 'multi-false': false, 'multi-true-2': true },
            );

            expect(result).toBe('valid-string true-class multi-true multi-true-2');
        });

        test('should handle all edge case combinations in a single call', () => {
            const dynamicCondition = true;
            const anotherCondition = false;

            const result = classNames(
                'base-class',
                dynamicCondition && 'conditional-class',
                anotherCondition && 'hidden-class',
                {
                    active: dynamicCondition,
                    inactive: !dynamicCondition,
                    disabled: anotherCondition,
                },
                null,
                undefined,
                '',
                ' ',
            );

            expect(result).toBe('base-class conditional-class active');
        });
    });
});
