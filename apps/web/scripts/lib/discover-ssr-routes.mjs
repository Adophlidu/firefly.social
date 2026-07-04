import fs from 'node:fs';
import path from 'node:path';

const PAGE_FILE = 'page.tsx';

function isSkippableSegment(segment) {
    return segment.startsWith('(') || segment.startsWith('@');
}

function isSkippableDirectory(name) {
    // Parallel (@*) and intercepting ((.)) slots duplicate real URLs — skip the walk.
    // Route groups like (normal) stay in the tree but are omitted from the URL pattern.
    return name.startsWith('@') || name.startsWith('(.)');
}

/** Turn an App Router pattern like `/[locale]/post/[source]/[id]` into a path-matching RegExp. */
export function patternToRegExp(pattern) {
    const escaped = pattern
        .split('/')
        .filter(Boolean)
        .map((segment) => {
            if (segment.startsWith('[[') && segment.endsWith(']]')) return '.*';
            if (segment.startsWith('[') && segment.endsWith(']')) return '[^/]+';
            return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/');
    return new RegExp(`^/${escaped}$`);
}

function pathMatchesPattern(path, pattern) {
    return patternToRegExp(pattern).test(path);
}

function segmentToPattern(segment) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
        return segment;
    }
    return segment;
}

/**
 * Walk the App Router tree and emit URL path patterns (dynamic segments kept as [param]).
 */
export function discoverRoutePatterns(appDir) {
    const patterns = [];

    function walk(currentDir, segments) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        const hasPage = entries.some((entry) => entry.isFile() && entry.name === PAGE_FILE);

        if (hasPage) {
            const urlSegments = segments.filter((segment) => !isSkippableSegment(segment));
            if (urlSegments.length > 0) {
                patterns.push(`/${urlSegments.map(segmentToPattern).join('/')}`);
            }
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (isSkippableDirectory(entry.name)) continue;
            walk(path.join(currentDir, entry.name), [...segments, entry.name]);
        }
    }

    walk(appDir, []);
    return [...new Set(patterns)].sort();
}

function replaceDynamicSegment(segment, samples) {
    if (segment.startsWith('[[') && segment.endsWith(']]')) {
        const value = samples[segment];
        return value === '' ? null : (value ?? null);
    }
    if (segment.startsWith('[') && segment.endsWith(']')) {
        return samples[segment] ?? null;
    }
    return segment;
}

/**
 * Expand a discovered pattern into a concrete path using sample param values.
 */
export function expandRoutePattern(pattern, samples) {
    const segments = pattern.split('/').filter(Boolean);
    const resolved = [];

    for (const segment of segments) {
        const next = replaceDynamicSegment(segment, samples);
        if (next === null) return null;
        resolved.push(next);
    }

    return `/${resolved.join('/')}`;
}

export function flattenConfiguredPaths(config) {
    const grouped = Object.values(config.pathGroups ?? {}).flat();
    return [...new Set([...(config.paths ?? []), ...grouped])].sort();
}

/** Build concrete explore tab URLs from `[explore]` or `[explore, source]` tuples. */
export function buildExplorePaths(locale, explorePaths = []) {
    return explorePaths.map((segments) => {
        const suffix = segments.filter(Boolean).join('/');
        return `/${locale}/explore/${suffix}`;
    });
}

export function resolveConfiguredPaths(config, locale = config.locale ?? 'en') {
    return [...new Set([...flattenConfiguredPaths(config), ...buildExplorePaths(locale, config.explorePaths)])].sort();
}

/**
 * Report App Router patterns that have no matching entry in the configured paths list.
 * Skipped patterns (auth, settings, …) are excluded.
 */
export function auditRouteCoverage(patterns, config) {
    const skipPatterns = (config.skipPatterns ?? []).map((pattern) => new RegExp(pattern));
    const configuredPaths = resolveConfiguredPaths(config);
    const auditedPatterns = patterns.filter((pattern) => !skipPatterns.some((regex) => regex.test(pattern)));

    const uncovered = [];
    const covered = [];

    for (const pattern of auditedPatterns) {
        const matches = configuredPaths.filter((routePath) => pathMatchesPattern(routePath, pattern));
        if (matches.length === 0) {
            uncovered.push(pattern);
        } else {
            covered.push({ pattern, paths: matches });
        }
    }

    const unmatchedPaths = configuredPaths.filter(
        (routePath) => !auditedPatterns.some((pattern) => pathMatchesPattern(routePath, pattern)),
    );

    return { uncovered, covered, unmatchedPaths, configuredPaths, auditedPatterns };
}

export function expandRoutes(patterns, config) {
    const samples = config.samples ?? {};
    const skipPatterns = (config.skipPatterns ?? []).map((pattern) => new RegExp(pattern));
    const explicitPaths = new Set(resolveConfiguredPaths(config));
    const expanded = new Map();

    for (const pattern of patterns) {
        if (skipPatterns.some((regex) => regex.test(pattern))) continue;

        const concrete = expandRoutePattern(pattern, samples);
        if (concrete) {
            expanded.set(concrete, { pattern, source: 'discovered' });
        }
    }

    for (const concrete of explicitPaths) {
        expanded.set(concrete, { pattern: concrete, source: 'config' });
    }

    return [...expanded.entries()]
        .map(([path, meta]) => ({ path, ...meta }))
        .sort((a, b) => a.path.localeCompare(b.path));
}
