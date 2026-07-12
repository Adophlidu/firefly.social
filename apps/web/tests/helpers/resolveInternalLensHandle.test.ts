import { describe, expect, test } from 'vitest';

import { resolveInternalLensHandle } from '@/helpers/resolveInternalLensHandle.js';

describe('resolveInternalLensHandle', () => {
    test('derives the lower-cased ff-<uid> handle for a uid', () => {
        expect(resolveInternalLensHandle('123')).toBe('ff-123');
    });

    test('lower-cases a uid that contains uppercase characters', () => {
        expect(resolveInternalLensHandle('AbC-xyz')).toBe('ff-abc-xyz');
    });

    test('returns undefined for an empty string', () => {
        expect(resolveInternalLensHandle('')).toBeUndefined();
    });

    test('returns undefined for null/undefined input', () => {
        expect(resolveInternalLensHandle(null)).toBeUndefined();
        expect(resolveInternalLensHandle(undefined)).toBeUndefined();
    });
});
