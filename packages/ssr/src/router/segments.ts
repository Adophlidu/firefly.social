/**
 * A single unit of a route id / URL path, parsed from a file name.
 *
 * - `static`   — literal URL segment (`posts`)
 * - `param`    — dynamic URL segment (`$id` matches one segment, captures `id`)
 * - `catchall` — wildcard URL segment (`$` matches zero or more segments, captures `*`)
 * - `group`    — pathless organizational segment (`(admin)`), part of the route id
 *                 but invisible in the URL
 */
export type RouteSegmentType = 'static' | 'param' | 'catchall' | 'group';

export interface RouteSegment {
    type: RouteSegmentType;
    /**
     * static: the literal text; param: the parameter name; catchall: always `*`;
     * group: the group name without parentheses.
     */
    name: string;
}

/** The role a route file plays, derived from its file name. */
export type RouteFileKind = 'root' | 'layout' | 'index' | 'route';

export interface ParsedRouteFile {
    /** What this file is. */
    kind: RouteFileKind;
    /**
     * Segments contributed by the file's path, in order. For `root`/`layout`
     * files these are the *directory* segments only; for `index`/`route` files
     * the file name itself also contributes (except the literal `index`).
     */
    segments: RouteSegment[];
    /**
     * For `layout` files: the directory segments the layout applies to
     * (same value as `segments`, kept explicit for clarity at call sites).
     */
    directory: RouteSegment[];
}

const ROUTE_FILE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/;

/** Reserved file base names that are not routes at all (middleware, etc.). */
const IGNORED_BASE_NAMES = new Set(['middleware']);

function parseSegment(raw: string): RouteSegment {
    if (raw === '$') return { type: 'catchall', name: '*' };
    if (raw.startsWith('$')) {
        const name = raw.slice(1);
        if (!name) throw new Error(`Invalid empty route parameter in segment "${raw}"`);
        return { type: 'param', name };
    }
    if (raw.startsWith('(') && raw.endsWith(')')) {
        const name = raw.slice(1, -1);
        if (!name) throw new Error('Invalid empty route group "()"');
        return { type: 'group', name };
    }
    if (!raw) throw new Error('Invalid empty route segment');
    return { type: 'static', name: raw };
}

/**
 * Parse a route file path (relative to the routes directory, POSIX separators)
 * into its kind and segments.
 *
 * Examples:
 * - `__root.tsx`            → root,    []
 * - `_layout.tsx`           → layout,  []
 * - `(admin)/_layout.tsx`   → layout,  [group(admin)]
 * - `index.tsx`             → index,   []
 * - `posts/index.tsx`       → index,   [static(posts)]
 * - `posts/$id.tsx`         → route,   [static(posts), param(id)]
 * - `$.tsx`                 → route,   [catchall(*)]
 * - `send.form.$id.tsx`     → route,   [static(send), static(form), param(id)]  (flat dot notation)
 * - `(admin)/users.tsx`     → route,   [group(admin), static(users)]
 *
 * Returns `null` for files that should be ignored by the router.
 */
export function parseRouteFile(filePath: string): ParsedRouteFile | null {
    const normalized = filePath.replaceAll('\\', '/').replace(/^\.\//, '');
    const withoutExtension = normalized.replace(ROUTE_FILE_EXTENSION, '');
    if (withoutExtension === normalized) {
        throw new Error(`Route file "${filePath}" has no recognizable script extension`);
    }

    const parts = withoutExtension.split('/').filter(Boolean);
    const baseName = parts.at(-1) ?? '';
    if (IGNORED_BASE_NAMES.has(baseName)) return null;

    const directoryParts = parts.slice(0, -1);
    const directory = directoryParts.map(parseSegment);

    if (baseName === '__root') {
        if (directory.length > 0) {
            throw new Error(`__root must live at the routes directory root, got "${filePath}"`);
        }
        return { kind: 'root', segments: [], directory: [] };
    }

    if (baseName === '_layout') {
        return { kind: 'layout', segments: directory, directory };
    }

    // Flat dot notation: `send.form.$id` expands to nested segments.
    // A literal `index` file name contributes no segment of its own.
    const nameParts = baseName === 'index' ? [] : baseName.split('.').map(parseSegment);
    const segments = [...directory, ...nameParts];

    return { kind: baseName === 'index' ? 'index' : 'route', segments, directory };
}
