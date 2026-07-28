import type { RouteNode, RouteTree } from './tree.ts';

export interface RouteMatch {
    /** Captured parameters. Catchall captures are stored under `*`. */
    params: Record<string, string>;
    /** The matched page node. */
    page: RouteNode;
    /**
     * Every node from the root down to the page, including pathless layout
     * and group nodes. Renderers walk this chain to compose nested layouts.
     */
    chain: RouteNode[];
    /** Files marked client-only (never loaded server-side). */
    clientOnlyFiles?: Set<string>;
}

export type Matcher = (pathname: string) => RouteMatch | null;

function normalizePathname(pathname: string): string[] {
    const stripped = pathname.replace(/\/+$/, '');
    if (!stripped || stripped === '') return [];
    return stripped.split('/').filter(Boolean);
}

function scoreOf(segmentType: RouteNode['fullSegments'][number]['type']): number {
    if (segmentType === 'static') return 3;
    if (segmentType === 'param') return 2;
    return 1;
}

/**
 * Compare two candidate score vectors. Higher per-position scores win;
 * when one vector is a strict prefix of the other, the shorter one wins
 * (an exact match beats a catchall that matched zero segments).
 */
function compareScores(a: number[], b: number[]): number {
    const length = Math.min(a.length, b.length);
    for (let index = 0; index < length; index += 1) {
        if (a[index] !== b[index]) return a[index] - b[index];
    }

    return b.length - a.length;
}

interface Candidate {
    page: RouteNode;
    params: Record<string, string>;
    scores: number[];
}

function matchPage(page: RouteNode, parts: string[]): Candidate | null {
    const segments = page.fullSegments.filter((s) => s.type !== 'group');
    const params: Record<string, string> = {};
    const scores: number[] = [];

    let index = 0;
    for (; index < segments.length; index += 1) {
        const segment = segments[index];
        const part = parts[index];

        if (segment.type === 'catchall') {
            params['*'] = parts
                .slice(index)
                .map((value) => decodeURIComponent(value))
                .join('/');
            scores.push(scoreOf('catchall'));
            return { page, params, scores };
        }

        if (part === undefined) return null;

        if (segment.type === 'static') {
            if (segment.name !== part) return null;
        } else {
            params[segment.name] = decodeURIComponent(part);
        }
        scores.push(scoreOf(segment.type));
    }

    // Pathname must be fully consumed (no trailing parts left over).
    if (index < parts.length) return null;

    return { page, params, scores };
}

function buildChain(page: RouteNode): RouteNode[] {
    const chain: RouteNode[] = [];
    let node: RouteNode | null = page;
    while (node) {
        chain.unshift(node);
        node = node.parent;
    }

    return chain;
}

/**
 * Create a pathname matcher over all pages in the tree.
 *
 * Priority is per-segment left-to-right: `static` beats `param` beats
 * `catchall`. Ties are broken toward the route that was inserted first.
 */
export function createMatcher(tree: RouteTree): Matcher {
    const pages = tree.pages;

    return (pathname: string): RouteMatch | null => {
        const parts = normalizePathname(pathname);
        let best: Candidate | null = null;

        for (const page of pages) {
            const candidate = matchPage(page, parts);
            if (!candidate) continue;
            if (!best || compareScores(candidate.scores, best.scores) > 0) {
                best = candidate;
            }
        }

        if (!best) return null;
        return {
            params: best.params,
            page: best.page,
            chain: buildChain(best.page),
            clientOnlyFiles: tree.clientOnlyFiles,
        };
    };
}
