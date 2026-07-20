import { describe, expect, it } from 'vitest';

import { isNotFoundError, isRedirectError, notFound, redirect } from './errors.ts';

describe('redirect', () => {
    it('throws a RedirectError with url and status', () => {
        try {
            redirect('/login', 307);
            expect.unreachable();
        } catch (error) {
            expect(isRedirectError(error)).toBe(true);
            if (isRedirectError(error)) {
                expect(error.url).toBe('/login');
                expect(error.status).toBe(307);
            }
        }
    });

    it('defaults to 302', () => {
        expect(() => redirect('/x')).toThrowError(expect.objectContaining({ status: 302 }));
    });
});

describe('notFound', () => {
    it('throws a NotFoundError', () => {
        try {
            notFound('gone');
            expect.unreachable();
        } catch (error) {
            expect(isNotFoundError(error)).toBe(true);
            expect((error as Error).message).toBe('gone');
        }
    });
});
