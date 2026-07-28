import type { ApiContext } from '@dimensiondev/ssr';
import { beforeAll, describe, expect, it } from 'vitest';

// next-auth falls back to process.env.NEXTAUTH_SECRET; must be set before the
// route module (and its options import chain) is evaluated.
process.env.NEXTAUTH_SECRET ??= 'auth-catchall-test-secret';
process.env.NEXTAUTH_URL ??= 'http://localhost:3000/';

let route: typeof import('@/routes/api/auth/$.js');

beforeAll(async () => {
    route = await import('@/routes/api/auth/$.js');
});

function createContext(path: string, init?: RequestInit): ApiContext {
    const url = new URL(path, 'http://localhost:3000');
    return {
        params: { '*': url.pathname.replace(/^\/api\/auth\/?/, '') },
        request: new Request(url, init),
        url,
    };
}

describe('api/auth catchall (next-auth on the SSR router)', () => {
    it('GET /api/auth/session returns an anonymous session object', async () => {
        const response = await route.GET(createContext('/api/auth/session'));
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.json()).toEqual({});
    });

    it('GET /api/auth/providers lists twitter, apple and google', async () => {
        const response = await route.GET(createContext('/api/auth/providers'));
        expect(response.status).toBe(200);
        const providers = (await response.json()) as Record<string, { id: string }>;
        expect(Object.keys(providers).sort()).toEqual(['apple', 'google', 'twitter']);
    });

    it('GET /api/auth/csrf returns a csrfToken and sets the csrf cookie', async () => {
        const response = await route.GET(createContext('/api/auth/csrf'));
        expect(response.status).toBe(200);
        const body = (await response.json()) as { csrfToken: string };
        expect(body.csrfToken).toBeTruthy();
        expect(response.headers.get('set-cookie')).toContain('next-auth.csrf-token');
    });

    it('GET /api/auth/signin redirects to /auth/error preserving the error param', async () => {
        const response = await route.GET(createContext('/api/auth/signin?error=OAuthSignin'));
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/auth/error?error=OAuthSignin');
    });

    it('GET /api/auth/callback/twitter with the MaskDelegate cookie returns the close-page HTML', async () => {
        const response = await route.GET(
            createContext('/api/auth/callback/twitter', {
                headers: { cookie: 'X-REQUEST_TOKEN-MASK-DELEGATE=true' },
            }),
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
        expect(await response.text()).toContain('X-REQUEST_TOKEN-MASK-DELEGATE');
        expect(response.headers.get('set-cookie')).toContain('X-REQUEST_TOKEN-MASK-DELEGATE=');
        expect(response.headers.get('set-cookie')).toContain('expires=Thu, 01 Jan 1970');
    });

    it('POST /api/auth/signout with a valid csrfToken returns the redirect url as JSON', async () => {
        const csrfResponse = await route.GET(createContext('/api/auth/csrf'));
        const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
        const csrfCookie = csrfResponse.headers.get('set-cookie')!.split(';')[0];

        const response = await route.POST(
            createContext('/api/auth/signout', {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    cookie: csrfCookie,
                    'X-Auth-Return-Redirect': '1',
                },
                body: new URLSearchParams({ csrfToken, json: 'true' }),
            }),
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('application/json');
        expect(await response.json()).toEqual({ url: 'http://localhost:3000' });
    });

    it('POST /api/auth/_log does not 404', async () => {
        const response = await route.POST(
            createContext('/api/auth/_log', {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ level: 'error', code: 'TEST', message: 'smoke' }),
            }),
        );
        expect(response.status).toBe(200);
    });
});
