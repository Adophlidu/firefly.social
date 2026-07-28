import { describe, expect, it } from 'vitest';

import { createMatcher } from './matcher.ts';
import { buildRouteTree } from './tree.ts';

function matcherFor(files: string[]) {
    return createMatcher(buildRouteTree({ files }));
}

describe('createMatcher', () => {
    it('matches static routes and the index', () => {
        const match = matcherFor(['index.tsx', 'about.tsx']);
        expect(match('/')?.page.path).toBe('/');
        expect(match('/about')?.page.path).toBe('/about');
        expect(match('/missing')).toBeNull();
    });

    it('prefers static over param over catchall', () => {
        const match = matcherFor(['posts/new.tsx', 'posts/$id.tsx', 'docs/$.tsx']);
        expect(match('/posts/new')?.page.path).toBe('/posts/new');
        expect(match('/posts/123')?.page.path).toBe('/posts/$id');
        expect(match('/docs/a/b/c')?.page.path).toBe('/docs/$');
    });

    it('rejects a param and a catchall as siblings (ambiguous)', () => {
        expect(() => matcherFor(['posts/$id.tsx', 'posts/$.tsx'])).toThrow(/Duplicate pages/);
    });

    it('extracts and decodes params', () => {
        const match = matcherFor(['posts/$source/$id.tsx']);
        const result = match('/posts/farcaster/hello%20world');
        expect(result?.params).toEqual({ source: 'farcaster', id: 'hello world' });
    });

    it('catchall captures the remainder and matches zero segments', () => {
        const match = matcherFor(['docs/$.tsx', 'docs.tsx']);
        expect(match('/docs/a/b')?.params['*']).toBe('a/b');
        // exact page beats a catchall matching zero segments
        expect(match('/docs')?.page.path).toBe('/docs');
    });

    it('normalizes trailing slashes', () => {
        const match = matcherFor(['about.tsx']);
        expect(match('/about/')?.page.path).toBe('/about');
        expect(match('/about//')?.page.path).toBe('/about');
    });

    it('returns the full chain including pathless layouts and groups', () => {
        const match = matcherFor(['__root.tsx', '_layout.tsx', '(admin)/_layout.tsx', '(admin)/users/$id.tsx']);
        const result = match('/users/42');
        expect(result?.params).toEqual({ id: '42' });
        expect(result?.chain.map((node) => node.id)).toEqual([
            '/',
            '/_layout',
            '/_layout/(admin)',
            '/_layout/(admin)/_layout',
            '/_layout/(admin)/_layout/users',
            '/_layout/(admin)/_layout/users/$id',
        ]);
        expect(result?.chain.filter((node) => node.layoutFile).map((node) => node.layoutFile)).toEqual([
            '_layout.tsx',
            '(admin)/_layout.tsx',
        ]);
    });

    it('prefers a root static page over a root catchall', () => {
        const match = matcherFor(['$.tsx', 'index.tsx']);
        expect(match('/')?.page.path).toBe('/');
        expect(match('/anything/else')?.page.path).toBe('/$');
    });
});
