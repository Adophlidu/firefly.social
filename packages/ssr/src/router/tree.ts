import { parseRouteFile, type RouteSegment } from './segments.ts';

/**
 * A node in the route tree. Nodes are created from route files or implicitly
 * as virtual grouping nodes (e.g. the `posts` part of `posts/$id.tsx` when no
 * `posts.tsx` exists).
 *
 * A node may simultaneously carry a `layoutFile` (renders around its subtree)
 * and a `pageFile` (makes it a routable page) — the equivalent of a directory
 * containing both a layout and an index page.
 */
export interface RouteNode {
    /** Unique id built from id segments, e.g. `/(admin)/users/$id`. */
    id: string;
    /** URL pattern from the root, e.g. `/users/$id`. Pathless segments excluded. */
    path: string;
    /** URL-visible segments of this node's own step (0 or 1 elements). */
    ownSegments: RouteSegment[];
    /** All segments from the root to this node, including pathless groups. */
    fullSegments: RouteSegment[];
    /** Only on the root node: the `__root` file. */
    rootFile?: string;
    layoutFile?: string;
    pageFile?: string;
    pageKind?: 'route' | 'index' | 'api';
    /**
     * Client-only node: the server skips loading and rendering its module
     * (rendering the nearest `pendingComponent` instead); the client loads
     * it on navigation. Marked via the `clientOnly` build option, not the
     * module itself, so the server never has to evaluate it.
     */
    clientOnly?: boolean;
    children: RouteNode[];
    parent: RouteNode | null;
}

export interface RouteTree {
    root: RouteNode;
    /** All routable pages (nodes with a `pageFile`), in insertion order. */
    pages: RouteNode[];
    /** Files marked client-only (their modules are never loaded server-side). */
    clientOnlyFiles?: Set<string>;
}

function segmentToIdElement(segment: RouteSegment): string {
    switch (segment.type) {
        case 'static':
            return segment.name;
        case 'param':
            return `$${segment.name}`;
        case 'catchall':
            return '$';
        case 'group':
            return `(${segment.name})`;
    }
}

function segmentsToPath(segments: RouteSegment[]): string {
    const visible = segments.filter((s) => s.type !== 'group');
    if (visible.length === 0) return '/';
    return (
        '/' +
        visible
            .map((s) => {
                if (s.type === 'static') return s.name;
                if (s.type === 'param') return `$${s.name}`;
                return '$';
            })
            .join('/')
    );
}

function createNode(
    parent: RouteNode | null,
    id: string,
    ownSegments: RouteSegment[],
    fullSegments: RouteSegment[],
): RouteNode {
    return {
        id,
        path: segmentsToPath(fullSegments),
        ownSegments,
        fullSegments,
        children: [],
        parent,
    };
}

/** Element id used for layout nodes: `_layout` under its directory id. */
function layoutNodeId(directoryId: string): string {
    return directoryId === '/' ? '/_layout' : `${directoryId}/_layout`;
}

export interface BuildRouteTreeOptions {
    /**
     * Route file paths relative to the routes directory, POSIX separators,
     * e.g. `['__root.tsx', 'posts/$id.tsx', '(admin)/users.tsx']`.
     */
    files: string[];
    /**
     * First URL segment that marks API routes. Files under this directory
     * export HTTP method handlers instead of page components.
     * Defaults to `'api'`.
     */
    apiPrefix?: string;
    /**
     * Mark route files as client-only. The server skips their modules
     * entirely (no evaluation, no SSR render — the nearest pendingComponent
     * is rendered instead); the client loads them on navigation/hydration.
     */
    clientOnly?: (file: string) => boolean;
}

/**
 * Build the route tree from a list of route file paths.
 *
 * Nesting rules:
 * - Directory segments and flat dot-notation segments nest progressively.
 * - `_layout.tsx` attaches to its directory node and wraps all pages below it.
 * - `(group)` segments are pathless: they appear in ids but never in URLs.
 * - `index` files attach their page to the directory node itself.
 * - Two pages resolving to the same URL pattern are a build-time error.
 */
export function buildRouteTree(options: BuildRouteTreeOptions): RouteTree {
    const { files, apiPrefix = 'api', clientOnly } = options;
    const clientOnlyFiles = new Set(files.filter((file) => clientOnly?.(file)));
    const root = createNode(null, '/', [], []);
    const nodeById = new Map<string, RouteNode>([['/', root]]);
    const pages: RouteNode[] = [];

    // First pass: index layouts by their directory id so routes can chain
    // through them regardless of file ordering.
    const layoutByDirectory = new Map<string, string>();
    const parsedFiles = files.map((file) => {
        const parsed = parseRouteFile(file);
        if (!parsed) return null;
        if (parsed.kind === 'layout') {
            const directoryId = segmentsToDirectoryId(parsed.directory);
            const existing = layoutByDirectory.get(directoryId);
            if (existing) {
                throw new Error(
                    `Duplicate layouts for directory "${directoryId}": "${existing}" and "${file}"`,
                );
            }
            layoutByDirectory.set(directoryId, file);
        }
        return { file, parsed };
    });

    function getOrCreateChild(parent: RouteNode, segment: RouteSegment): RouteNode {
        const id = parent.id === '/' ? `/${segmentToIdElement(segment)}` : `${parent.id}/${segmentToIdElement(segment)}`;
        const existing = nodeById.get(id);
        if (existing) return existing;
        const node = createNode(parent, id, [segment], [...parent.fullSegments, segment]);
        nodeById.set(id, node);
        parent.children.push(node);
        return node;
    }

    function getOrCreateLayout(directoryNode: RouteNode, file: string): RouteNode {
        const id = layoutNodeId(directoryNode.id);
        const existing = nodeById.get(id);
        if (existing) return existing;
        // Layout nodes are pathless: they add no URL segment of their own.
        const node = createNode(directoryNode, id, [], [...directoryNode.fullSegments]);
        nodeById.set(id, node);
        directoryNode.children.push(node);
        node.layoutFile = file;
        return node;
    }

    /**
     * Walk from the root through directory segments (chaining through any
     * `_layout` that exists at each directory prefix) and return the node
     * that files directly inside `directory` should attach to.
     */
    function walkToDirectory(directory: RouteSegment[]): RouteNode {
        let node = root;
        const rootLayout = layoutByDirectory.get('/');
        if (rootLayout) node = getOrCreateLayout(node, rootLayout);
        for (let index = 0; index < directory.length; index += 1) {
            node = getOrCreateChild(node, directory[index]);
            const directoryId = segmentsToDirectoryId(directory.slice(0, index + 1));
            const layout = layoutByDirectory.get(directoryId);
            if (layout) node = getOrCreateLayout(node, layout);
        }
        return node;
    }

    // Second pass: attach everything. Layouts also go through walkToDirectory
    // so nested layouts chain through their ancestors.
    for (const entry of parsedFiles) {
        if (!entry) continue;
        const { file, parsed } = entry;

        if (parsed.kind === 'root') {
            if (root.rootFile) {
                throw new Error(`Duplicate __root files: "${root.rootFile}" and "${file}"`);
            }
            root.rootFile = file;
            continue;
        }

        if (parsed.kind === 'layout') {
            // walkToDirectory returns this layout's own node (created and
            // annotated by getOrCreateLayout along the way).
            const layoutNode = walkToDirectory(parsed.directory);
            if (clientOnly?.(file)) layoutNode.clientOnly = true;
            continue;
        }

        const node = walkToDirectory(parsed.directory);
        const nameSegments = parsed.segments.slice(parsed.directory.length);
        let leaf = node;
        for (const segment of nameSegments) {
            leaf = getOrCreateChild(leaf, segment);
        }
        if (leaf.pageFile) {
            throw new Error(
                `Duplicate pages for URL "${leaf.path}": "${leaf.pageFile}" and "${file}"`,
            );
        }
        leaf.pageFile = file;
        const firstVisible = leaf.fullSegments.find((s) => s.type !== 'group');
        const isApi = firstVisible?.type === 'static' && firstVisible.name === apiPrefix;
        leaf.pageKind = isApi ? 'api' : parsed.kind === 'index' ? 'index' : 'route';
        if (!isApi && clientOnly?.(file)) leaf.clientOnly = true;
        pages.push(leaf);
    }

    // Catchalls must be terminal segments, and no two pages may resolve to the
    // same URL shape (param names don't matter: `$id` and `$slug` collide).
    const canonicalUrlByPage = new Map<string, string>();
    for (const page of pages) {
        const visible = page.fullSegments.filter((s) => s.type !== 'group');
        const catchallIndex = visible.findIndex((s) => s.type === 'catchall');
        if (catchallIndex !== -1 && catchallIndex !== visible.length - 1) {
            throw new Error(`Catchall segment must be the last segment of a route ("${page.id}")`);
        }
        const canonical =
            '/' + visible.map((s) => (s.type === 'static' ? s.name : '$')).join('/');
        const existing = canonicalUrlByPage.get(canonical);
        if (existing) {
            throw new Error(
                `Duplicate pages for URL "${canonical}": "${existing}" and "${page.pageFile}"`,
            );
        }
        canonicalUrlByPage.set(canonical, page.pageFile ?? page.id);
    }

    return clientOnlyFiles.size > 0 ? { root, pages, clientOnlyFiles } : { root, pages };
}

function segmentsToDirectoryId(segments: RouteSegment[]): string {
    if (segments.length === 0) return '/';
    return '/' + segments.map(segmentToIdElement).join('/');
}
