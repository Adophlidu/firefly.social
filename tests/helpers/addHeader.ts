import { describe, expect, test, vi } from 'vitest';

import { addHeader, addHeaders } from '@/helpers/addHeader.js';

describe('addHeader', () => {
    describe('when headers is null or undefined', () => {
        test('should return new object with header when headers is null', () => {
            const result = addHeader(null, 'Content-Type', 'application/json');
            expect(result).toEqual({ 'Content-Type': 'application/json' });
        });

        test('should return new object with header when headers is undefined', () => {
            const result = addHeader(undefined, 'Authorization', 'Bearer token');
            expect(result).toEqual({ Authorization: 'Bearer token' });
        });
    });

    describe('when headers is a Headers instance', () => {
        test('should add new header when key does not exist (force=true by default)', () => {
            const headers = new Headers({ 'Content-Type': 'text/plain' });
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).toBeInstanceOf(Headers);
            expect((result as Headers).get('Content-Type')).toBe('text/plain');
            expect((result as Headers).get('Authorization')).toBe('Bearer token');
        });

        test('should overwrite existing header when force=true (default)', () => {
            const headers = new Headers({ 'Content-Type': 'text/plain' });
            const result = addHeader(headers, 'Content-Type', 'application/json');

            expect(result).toBeInstanceOf(Headers);
            expect((result as Headers).get('Content-Type')).toBe('application/json');
        });

        test('should not overwrite existing header when force=false', () => {
            const headers = new Headers({ 'Content-Type': 'text/plain' });
            const result = addHeader(headers, 'Content-Type', 'application/json', false);

            expect(result).toBe(headers); // Should return original headers unchanged
            expect((result as Headers).get('Content-Type')).toBe('text/plain');
        });

        test('should add new header when force=false and key does not exist', () => {
            const headers = new Headers({ 'Content-Type': 'text/plain' });
            const result = addHeader(headers, 'Authorization', 'Bearer token', false);

            expect(result).toBeInstanceOf(Headers);
            expect((result as Headers).get('Content-Type')).toBe('text/plain');
            expect((result as Headers).get('Authorization')).toBe('Bearer token');
        });

        test('should create new Headers instance (not mutate original)', () => {
            const headers = new Headers({ 'Content-Type': 'text/plain' });
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).not.toBe(headers);
            expect(headers.get('Authorization')).toBeNull(); // Original should be unchanged
        });
    });

    describe('when headers is an array', () => {
        test('should add new header when key does not exist (force=true by default)', () => {
            const headers: [string, string][] = [['Content-Type', 'text/plain']];
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result).toContainEqual(['Content-Type', 'text/plain']);
            expect(result).toContainEqual(['Authorization', 'Bearer token']);
        });

        test('should add duplicate header when force=true (default)', () => {
            const headers: [string, string][] = [['Content-Type', 'text/plain']];
            const result = addHeader(headers, 'Content-Type', 'application/json');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result).toContainEqual(['Content-Type', 'text/plain']);
            expect(result).toContainEqual(['Content-Type', 'application/json']);
        });

        test('should not add header when force=false and key exists', () => {
            const headers: [string, string][] = [['Content-Type', 'text/plain']];
            const result = addHeader(headers, 'Content-Type', 'application/json', false);

            expect(result).toBe(headers); // Should return original array unchanged
            expect(result).toHaveLength(1);
            expect(result).toContainEqual(['Content-Type', 'text/plain']);
        });

        test('should add new header when force=false and key does not exist', () => {
            const headers: [string, string][] = [['Content-Type', 'text/plain']];
            const result = addHeader(headers, 'Authorization', 'Bearer token', false);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result).toContainEqual(['Content-Type', 'text/plain']);
            expect(result).toContainEqual(['Authorization', 'Bearer token']);
        });

        test('should create new array (not mutate original)', () => {
            const headers: [string, string][] = [['Content-Type', 'text/plain']];
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).not.toBe(headers);
            expect(headers).toHaveLength(1); // Original should be unchanged
        });

        test('should handle empty array', () => {
            const headers: [string, string][] = [];
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result).toContainEqual(['Authorization', 'Bearer token']);
        });
    });

    describe('when headers is an object', () => {
        test('should add new header when key does not exist (force=true by default)', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).toEqual({
                'Content-Type': 'text/plain',
                Authorization: 'Bearer token',
            });
        });

        test('should overwrite existing header when force=true (default)', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'Content-Type', 'application/json');

            expect(result).toEqual({
                'Content-Type': 'application/json',
            });
        });

        test('should not overwrite existing header when force=false', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'Content-Type', 'application/json', false);

            expect(result).toBe(headers); // Should return original object unchanged
            expect(result).toEqual({ 'Content-Type': 'text/plain' });
        });

        test('should add new header when force=false and key does not exist', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'Authorization', 'Bearer token', false);

            expect(result).toEqual({
                'Content-Type': 'text/plain',
                Authorization: 'Bearer token',
            });
        });

        test('should create new object (not mutate original)', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).not.toBe(headers);
            expect(headers).toEqual({ 'Content-Type': 'text/plain' }); // Original should be unchanged
        });

        test('should handle empty object', () => {
            const headers = {};
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).toEqual({ Authorization: 'Bearer token' });
        });

        test('should handle object with multiple headers', () => {
            const headers = {
                'Content-Type': 'text/plain',
                'User-Agent': 'Mozilla/5.0',
            };
            const result = addHeader(headers, 'Authorization', 'Bearer token');

            expect(result).toEqual({
                'Content-Type': 'text/plain',
                'User-Agent': 'Mozilla/5.0',
                Authorization: 'Bearer token',
            });
        });
    });

    describe('edge cases', () => {
        test('should handle case-sensitive header keys', () => {
            const headers = { 'Content-Type': 'text/plain' };
            const result = addHeader(headers, 'content-type', 'application/json');

            // Should treat as different keys (case-sensitive)
            expect(result).toEqual({
                'Content-Type': 'text/plain',
                'content-type': 'application/json',
            });
        });

        test('should handle empty string values', () => {
            const headers = {};
            const result = addHeader(headers, 'X-Custom-Header', '');

            expect(result).toEqual({ 'X-Custom-Header': '' });
        });

        test('should handle special characters in header values', () => {
            const headers = {};
            const result = addHeader(headers, 'Authorization', 'Bearer token:with:colons');

            expect(result).toEqual({ Authorization: 'Bearer token:with:colons' });
        });

        test('should handle numeric header values (as strings)', () => {
            const headers = {};
            const result = addHeader(headers, 'Content-Length', '12345');

            expect(result).toEqual({ 'Content-Length': '12345' });
        });
    });

    describe('invalid headers type', () => {
        test('should warn and return original headers for invalid type', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const invalidHeaders = 'invalid' as unknown as HeadersInit;
            const result = addHeader(invalidHeaders, 'Authorization', 'Bearer token');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[addHeader] Failed to add header'),
                'string',
            );
            expect(result).toBe(invalidHeaders);

            consoleSpy.mockRestore();
        });
    });
});

describe('addHeaders', () => {
    test('should add multiple headers to empty headers', () => {
        const headers = {};
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
            'User-Agent': 'Mozilla/5.0',
        };
        const result = addHeaders(headers, otherHeaders);

        expect(result).toEqual(otherHeaders);
    });

    test('should add multiple headers to existing object headers', () => {
        const headers = { 'X-Custom': 'value1' };
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        };
        const result = addHeaders(headers, otherHeaders);

        expect(result).toEqual({
            'X-Custom': 'value1',
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        });
    });

    test('should add multiple headers to Headers instance', () => {
        const headers = new Headers({ 'X-Custom': 'value1' });
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        };
        const result = addHeaders(headers, otherHeaders);

        expect(result).toBeInstanceOf(Headers);
        expect((result as Headers).get('X-Custom')).toBe('value1');
        expect((result as Headers).get('Content-Type')).toBe('application/json');
        expect((result as Headers).get('Authorization')).toBe('Bearer token');
    });

    test('should add multiple headers to array headers', () => {
        const headers: [string, string][] = [['X-Custom', 'value1']];
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        };
        const result = addHeaders(headers, otherHeaders);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toContainEqual(['X-Custom', 'value1']);
        expect(result).toContainEqual(['Content-Type', 'application/json']);
        expect(result).toContainEqual(['Authorization', 'Bearer token']);
    });

    test('should overwrite existing headers when adding (force=true by default)', () => {
        const headers = { 'Content-Type': 'text/plain' };
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        };
        const result = addHeaders(headers, otherHeaders);

        expect(result).toEqual({
            'Content-Type': 'application/json', // Should be overwritten
            Authorization: 'Bearer token',
        });
    });

    test('should handle empty otherHeaders object', () => {
        const headers = { 'Content-Type': 'text/plain' };
        const otherHeaders = {};
        const result = addHeaders(headers, otherHeaders);

        expect(result).toEqual({ 'Content-Type': 'text/plain' });
    });

    test('should handle null headers', () => {
        const otherHeaders = {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
        };
        const result = addHeaders(null, otherHeaders);

        expect(result).toEqual(otherHeaders);
    });
});
