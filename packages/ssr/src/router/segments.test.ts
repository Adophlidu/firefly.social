import { describe, expect, it } from 'vitest';

import { parseRouteFile } from './segments.ts';

describe('parseRouteFile', () => {
    it('parses the root layout', () => {
        expect(parseRouteFile('__root.tsx')).toEqual({
            kind: 'root',
            segments: [],
            directory: [],
        });
    });

    it('rejects __root in a subdirectory', () => {
        expect(() => parseRouteFile('posts/__root.tsx')).toThrow(/__root must live/);
    });

    it('parses layouts at any directory depth', () => {
        expect(parseRouteFile('_layout.tsx')).toEqual({
            kind: 'layout',
            segments: [],
            directory: [],
        });
        expect(parseRouteFile('(admin)/_layout.tsx')).toEqual({
            kind: 'layout',
            segments: [{ type: 'group', name: 'admin' }],
            directory: [{ type: 'group', name: 'admin' }],
        });
    });

    it('parses index routes without contributing a segment', () => {
        expect(parseRouteFile('index.tsx')).toEqual({ kind: 'index', segments: [], directory: [] });
        expect(parseRouteFile('posts/index.tsx')).toEqual({
            kind: 'index',
            segments: [{ type: 'static', name: 'posts' }],
            directory: [{ type: 'static', name: 'posts' }],
        });
    });

    it('parses param and catchall segments', () => {
        expect(parseRouteFile('posts/$id.tsx')?.segments).toEqual([
            { type: 'static', name: 'posts' },
            { type: 'param', name: 'id' },
        ]);
        expect(parseRouteFile('docs/$.tsx')?.segments).toEqual([
            { type: 'static', name: 'docs' },
            { type: 'catchall', name: '*' },
        ]);
    });

    it('expands flat dot notation into nested segments', () => {
        expect(parseRouteFile('send.form.$id.tsx')?.segments).toEqual([
            { type: 'static', name: 'send' },
            { type: 'static', name: 'form' },
            { type: 'param', name: 'id' },
        ]);
    });

    it('parses pathless groups', () => {
        expect(parseRouteFile('(admin)/users.tsx')?.segments).toEqual([
            { type: 'group', name: 'admin' },
            { type: 'static', name: 'users' },
        ]);
    });

    it('ignores non-route files and accepts multiple extensions', () => {
        expect(parseRouteFile('middleware.ts')).toBeNull();
        expect(parseRouteFile('posts/$id.route.ts')?.kind).toBe('route');
        expect(parseRouteFile('posts/$id.jsx')?.kind).toBe('route');
    });

    it('rejects malformed segments', () => {
        expect(() => parseRouteFile('posts/$.tsx')).not.toThrow();
        expect(() => parseRouteFile('posts/().tsx')).toThrow(/empty route group/);
        expect(() => parseRouteFile('posts/$.tsx')).toBeDefined();
        expect(() => parseRouteFile('README.md')).toThrow(/extension/);
    });
});
