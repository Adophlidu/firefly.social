import { NetworkError } from '@dimensiondev/utils';
import { describe, expect, test } from 'vitest';

import { isNetworkError } from '@/helpers/isNetworkError.js';

describe('isNetworkError', () => {
    test('matches the browser "Failed to fetch" TypeError verbatim', () => {
        expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    });

    test('matches "Load failed" (WebKit)', () => {
        expect(isNetworkError(new TypeError('Load failed'))).toBe(true);
    });

    test('matches "Network request failed" (legacy)', () => {
        expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    });

    test('matches a raw Error whose message contains the network string', () => {
        expect(isNetworkError(new Error('something: Failed to fetch: else'))).toBe(true);
    });

    test('matches a raw string', () => {
        expect(isNetworkError('Failed to fetch')).toBe(true);
    });

    test('matches an abort (DOMException named AbortError)', () => {
        // Real fetch aborts surface as an error whose `name` is "AbortError";
        // String() then yields "AbortError: ...", which contains "Abort".
        const abort = Object.assign(new Error('The user aborted a request'), { name: 'AbortError' });
        expect(isNetworkError(abort)).toBe(true);
    });

    test('matches the app typed NetworkError (default message)', () => {
        expect(isNetworkError(new NetworkError())).toBe(true);
    });

    test('matches the app typed NetworkError (custom message)', () => {
        expect(isNetworkError(new NetworkError('custom'))).toBe(true);
    });

    test('does NOT match an unrelated Error', () => {
        expect(isNetworkError(new Error('Failed to publish post to Bsky'))).toBe(false);
    });

    test('does NOT match a plain object', () => {
        expect(isNetworkError({ foo: 'bar' })).toBe(false);
    });

    test('does NOT match null/undefined', () => {
        expect(isNetworkError(null)).toBe(false);
        expect(isNetworkError(undefined)).toBe(false);
    });
});
