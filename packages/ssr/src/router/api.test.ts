import { describe, expect, it } from 'vitest';

import { coerceToResponse, dispatchApiRoute } from './api.ts';
import { createMatcher } from './matcher.ts';
import { buildRouteTree } from './tree.ts';

describe('buildRouteTree API marking', () => {
    it('marks files under the api directory as api pages', () => {
        const tree = buildRouteTree({
            files: ['index.tsx', 'api/hello.ts', 'api/users/$id.ts'],
        });
        const byPath = new Map(tree.pages.map((page) => [page.path, page]));
        expect(byPath.get('/')?.pageKind).toBe('index');
        expect(byPath.get('/api/hello')?.pageKind).toBe('api');
        expect(byPath.get('/api/users/$id')?.pageKind).toBe('api');
    });

    it('supports a custom api prefix and sees through groups', () => {
        const tree = buildRouteTree({
            files: ['(v1)/rpc/health.ts'],
            apiPrefix: 'rpc',
        });
        expect(tree.pages[0].pageKind).toBe('api');
        expect(tree.pages[0].path).toBe('/rpc/health');
    });
});

describe('dispatchApiRoute', () => {
    const context = (method: string) => ({
        params: { id: '42' },
        request: new Request('http://localhost/api/users/42', { method }),
        url: new URL('http://localhost/api/users/42'),
    });

    it('dispatches to the exported method handler with params', async () => {
        const response = await dispatchApiRoute({ GET: ({ params }) => ({ id: params.id }) }, context('GET'));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ id: '42' });
    });

    it('returns 405 with an Allow header for unimplemented methods', async () => {
        const response = await dispatchApiRoute({ GET: () => 'ok' }, context('POST'));
        expect(response.status).toBe(405);
        expect(response.headers.get('allow')).toBe('GET');
    });

    it('falls back from HEAD to GET', async () => {
        const response = await dispatchApiRoute({ GET: () => 'ok' }, context('HEAD'));
        expect(response.status).toBe(200);
    });
});

describe('coerceToResponse', () => {
    it('passes Response through', () => {
        const original = new Response('x', { status: 418 });
        expect(coerceToResponse(original)).toBe(original);
    });

    it('maps nullish to 204, strings to text/plain, objects to JSON', async () => {
        expect(coerceToResponse(undefined).status).toBe(204);
        expect(coerceToResponse('hi').headers.get('content-type')).toContain('text/plain');
        const json = coerceToResponse({ a: 1 });
        expect(json.headers.get('content-type')).toContain('application/json');
        expect(await json.json()).toEqual({ a: 1 });
    });
});

describe('matcher over api routes', () => {
    it('matches api pages like any other route', () => {
        const tree = buildRouteTree({ files: ['api/users/$id.ts'] });
        const match = createMatcher(tree)('/api/users/7');
        expect(match?.page.pageKind).toBe('api');
        expect(match?.params).toEqual({ id: '7' });
    });
});
