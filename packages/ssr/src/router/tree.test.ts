import { describe, expect, it } from 'vitest';

import type { RouteNode } from './tree.ts';
import { buildRouteTree } from './tree.ts';

function findNode(root: RouteNode, id: string): RouteNode | undefined {
    if (root.id === id) return root;

    for (const child of root.children) {
        const found = findNode(child, id);
        if (found) return found;
    }

    return undefined;
}

describe('buildRouteTree', () => {
    it('builds a flat list of pages', () => {
        const tree = buildRouteTree({
            files: ['__root.tsx', 'index.tsx', 'about.tsx', 'posts/$id.tsx'],
        });
        expect(tree.pages.map((p) => p.path)).toEqual(['/', '/about', '/posts/$id']);
        expect(tree.root.rootFile).toBe('__root.tsx');
    });

    it('creates virtual intermediate nodes and lets real files claim them', () => {
        const tree = buildRouteTree({
            files: ['posts/$id.tsx', 'posts.tsx'],
        });
        const posts = findNode(tree.root, '/posts');
        expect(posts?.pageFile).toBe('posts.tsx');
        const id = findNode(tree.root, '/posts/$id');
        expect(id?.pageFile).toBe('posts/$id.tsx');
        expect(id?.parent).toBe(posts);
    });

    it('expands flat dot notation into nested nodes', () => {
        const tree = buildRouteTree({ files: ['send.form.$id.tsx'] });
        const leaf = findNode(tree.root, '/send/form/$id');
        expect(leaf?.path).toBe('/send/form/$id');
        expect(leaf?.pageFile).toBe('send.form.$id.tsx');
        // intermediate nodes are virtual
        expect(findNode(tree.root, '/send')?.pageFile).toBeUndefined();
    });

    it('attaches index pages to their directory node', () => {
        const tree = buildRouteTree({ files: ['posts/index.tsx'] });
        const posts = findNode(tree.root, '/posts');
        expect(posts?.pageFile).toBe('posts/index.tsx');
        expect(posts?.pageKind).toBe('index');
    });

    it('keeps groups pathless but part of the id', () => {
        const tree = buildRouteTree({ files: ['(admin)/users.tsx'] });
        const node = findNode(tree.root, '/(admin)/users');
        expect(node?.path).toBe('/users');
        expect(node?.fullSegments).toEqual([
            { type: 'group', name: 'admin' },
            { type: 'static', name: 'users' },
        ]);
    });

    it('rejects duplicate pages for the same URL, including across groups', () => {
        expect(() => buildRouteTree({ files: ['posts.tsx', 'posts/index.tsx'] })).toThrow(/Duplicate pages/);
        expect(() => buildRouteTree({ files: ['(a)/users.tsx', '(b)/users.tsx'] })).toThrow(/Duplicate pages/);
    });

    it('chains layouts around the pages in their directory', () => {
        const tree = buildRouteTree({
            files: ['_layout.tsx', 'posts/_layout.tsx', 'posts/$id.tsx', 'index.tsx', 'about.tsx'],
        });
        const rootLayout = findNode(tree.root, '/_layout');
        expect(rootLayout?.layoutFile).toBe('_layout.tsx');

        const postsLayout = findNode(tree.root, '/_layout/posts/_layout');
        expect(postsLayout?.layoutFile).toBe('posts/_layout.tsx');

        // pages inside posts/ hang below both layouts
        const id = findNode(tree.root, '/_layout/posts/_layout/$id');
        expect(id?.pageFile).toBe('posts/$id.tsx');

        // pages outside posts/ hang below the root layout only
        const about = findNode(tree.root, '/_layout/about');
        expect(about?.pageFile).toBe('about.tsx');
    });

    it('works without any root or layout file', () => {
        const tree = buildRouteTree({ files: ['index.tsx'] });
        expect(tree.root.rootFile).toBeUndefined();
        expect(tree.pages).toHaveLength(1);
    });

    it('rejects a catchall in a non-terminal position', () => {
        expect(() => buildRouteTree({ files: ['docs.$.more.tsx'] })).toThrow(/Catchall segment must be the last/);
    });
});
