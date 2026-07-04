#!/usr/bin/env node
/**
 * Collect SSR HTML from a running Firefly web dev server and analyze duplication.
 *
 * Usage:
 *   pnpm --filter @dimensiondev/firefly-web ssr:collect
 *   node apps/web/scripts/collect-ssr-pages.mjs --base-url http://localhost:3000
 *   node apps/web/scripts/collect-ssr-pages.mjs --analyze-only --out-dir apps/web/.ssr-pages
 *
 * Requires the web app to be running (`pnpm dev` in apps/web).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { analyzeCollection, analyzeHtml, renderMarkdownReport } from './lib/analyze-ssr-html.mjs';
import {
    auditRouteCoverage,
    discoverRoutePatterns,
    expandRoutes,
    resolveConfiguredPaths,
} from './lib/discover-ssr-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT_DIR = path.join(APP_ROOT, '.ssr-pages');
const DEFAULT_ROUTES_CONFIG = path.join(__dirname, 'ssr-pages.routes.json');
const DEFAULT_APP_DIR = path.join(APP_ROOT, 'src/app');

function parseArgs(argv) {
    const options = {
        baseUrl: process.env.SSR_BASE_URL ?? 'http://localhost:3000',
        outDir: DEFAULT_OUT_DIR,
        routesConfig: DEFAULT_ROUTES_CONFIG,
        appDir: DEFAULT_APP_DIR,
        concurrency: 4,
        analyzeOnly: false,
        locale: 'en',
        configPathsOnly: false,
        verifyRoutes: false,
        timeoutMs: 90_000,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case '--base-url':
                options.baseUrl = argv[++index];
                break;
            case '--out-dir':
                options.outDir = path.resolve(argv[++index]);
                break;
            case '--routes-config':
                options.routesConfig = path.resolve(argv[++index]);
                break;
            case '--concurrency':
                options.concurrency = Number(argv[++index]);
                break;
            case '--locale':
                options.locale = argv[++index];
                break;
            case '--config-paths-only':
                options.configPathsOnly = true;
                break;
            case '--verify-routes':
                options.verifyRoutes = true;
                break;
            case '--timeout':
                options.timeoutMs = Number(argv[++index]);
                break;
            case '--analyze-only':
                options.analyzeOnly = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return options;
}

function printHelp() {
    console.log(`Collect SSR HTML and analyze duplication.

Options:
  --base-url <url>         Dev server base URL (default: http://localhost:3000)
  --out-dir <path>         Output directory (default: apps/web/.ssr-pages)
  --routes-config <path>   Route samples config (default: scripts/ssr-pages.routes.json)
  --concurrency <n>        Parallel fetches (default: 4)
  --locale <code>          Locale prefix for discovered routes (default: en)
  --config-paths-only      Fetch only explicit paths from routes config (faster SSR audit)
  --verify-routes          Check routes config covers all discoverable App Router pages, then exit
  --timeout <ms>           Per-request timeout (default: 30000)
  --analyze-only           Re-run analysis on saved HTML without fetching
  --help                   Show this help
`);
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function slugifyPath(urlPath) {
    return (
        urlPath
            .replace(/^\//, '')
            .replace(/\//g, '__')
            .replace(/[^a-zA-Z0-9._-]+/g, '_') || 'root'
    );
}

async function mapPool(items, concurrency, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const current = nextIndex;
            nextIndex += 1;
            results[current] = await worker(items[current], current);
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
    return results;
}

async function fetchPage(baseUrl, routePath, timeoutMs) {
    const url = new URL(routePath, baseUrl);
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'text/html,application/xhtml+xml',
                'Accept-Language': 'en',
                Cookie: 'locale=en',
            },
            redirect: 'follow',
            signal: controller.signal,
        });

        const html = await response.text();
        const elapsedMs = Date.now() - startedAt;

        return {
            path: routePath,
            url: url.toString(),
            status: response.status,
            ok: response.ok,
            elapsedMs,
            html,
            headers: Object.fromEntries(response.headers.entries()),
        };
    } finally {
        clearTimeout(timer);
    }
}

function loadRoutes(configPath, appDir, locale, configPathsOnly) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.samples = {
        ...(config.samples ?? {}),
        '[locale]': locale ?? config.locale ?? 'en',
    };

    if (configPathsOnly) {
        const routes = resolveConfiguredPaths(config).map((routePath) => ({
            path: routePath,
            pattern: routePath,
            source: 'config',
        }));
        return { config, patterns: [], routes };
    }

    const patterns = discoverRoutePatterns(appDir);
    const routes = expandRoutes(patterns, config);

    return { config, patterns, routes };
}

function writeManifest(outDir, payload) {
    fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(payload, null, 2)}\n`);
}

async function collectPages(options, routes) {
    const pagesDir = path.join(options.outDir, 'pages');
    ensureDir(pagesDir);

    console.log(`Collecting ${routes.length} routes from ${options.baseUrl} ...`);

    const results = await mapPool(routes, options.concurrency, async (route) => {
        try {
            const fetched = await fetchPage(options.baseUrl, route.path, options.timeoutMs);
            const slug = slugifyPath(route.path);
            const htmlPath = path.join(pagesDir, `${slug}.html`);
            const metaPath = path.join(pagesDir, `${slug}.meta.json`);

            fs.writeFileSync(htmlPath, fetched.html);
            fs.writeFileSync(
                metaPath,
                `${JSON.stringify(
                    {
                        path: fetched.path,
                        url: fetched.url,
                        pattern: route.pattern,
                        source: route.source,
                        status: fetched.status,
                        ok: fetched.ok,
                        elapsedMs: fetched.elapsedMs,
                        htmlBytes: fetched.html.length,
                        htmlFile: path.relative(options.outDir, htmlPath),
                    },
                    null,
                    2,
                )}\n`,
            );

            const statusLabel = fetched.ok ? `${fetched.status}` : `${fetched.status} FAIL`;
            console.log(
                `  [${statusLabel}] ${route.path} (${fetched.html.length.toLocaleString()} bytes, ${fetched.elapsedMs}ms)`,
            );

            return {
                ...fetched,
                pattern: route.pattern,
                source: route.source,
                htmlPath,
                metaPath,
                analysis: fetched.ok ? analyzeHtml(fetched.html, fetched.path) : null,
            };
        } catch (error) {
            const cause = error instanceof Error && 'cause' in error ? error.cause : null;
            const message =
                error instanceof Error && error.name === 'AbortError'
                    ? `timed out after ${options.timeoutMs}ms`
                    : cause instanceof Error
                      ? cause.message
                      : error instanceof Error
                        ? error.message
                        : String(error);
            console.error(`  [ERROR] ${route.path}: ${message}`);
            return {
                path: route.path,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
                analysis: null,
            };
        }
    });

    return results;
}

function loadSavedPages(outDir) {
    const pagesDir = path.join(outDir, 'pages');
    if (!fs.existsSync(pagesDir)) {
        throw new Error(`Missing pages directory: ${pagesDir}`);
    }

    return fs
        .readdirSync(pagesDir)
        .filter((name) => name.endsWith('.meta.json'))
        .map((metaName) => {
            const metaPath = path.join(pagesDir, metaName);
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            const htmlPath = path.join(pagesDir, `${path.basename(metaName, '.meta.json')}.html`);
            const html = fs.readFileSync(htmlPath, 'utf8');

            return {
                path: meta.path,
                ok: meta.ok,
                status: meta.status,
                html,
                htmlPath,
                metaPath,
                analysis: meta.ok ? analyzeHtml(html, meta.path) : null,
            };
        });
}

function writeAnalysis(outDir, pageResults, routesMeta) {
    const analysisDir = path.join(outDir, 'analysis');
    ensureDir(analysisDir);

    const summary = analyzeCollection(pageResults);
    const perPage = pageResults.map((page) => ({
        path: page.path,
        ok: page.ok,
        status: page.status,
        htmlBytes: page.analysis?.htmlBytes ?? page.html?.length ?? 0,
        rscBytes: page.analysis?.rscBytes ?? 0,
        rscChunkCount: page.analysis?.rscChunkCount ?? 0,
        wastedBytesEstimate: page.analysis?.wastedBytesEstimate ?? 0,
        withinPageDuplicates: page.analysis?.withinPageDuplicates ?? [],
        error: page.error,
    }));

    fs.writeFileSync(path.join(analysisDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    fs.writeFileSync(path.join(analysisDir, 'pages.json'), `${JSON.stringify(perPage, null, 2)}\n`);
    fs.writeFileSync(path.join(analysisDir, 'report.md'), renderMarkdownReport(summary));

    writeManifest(outDir, {
        ...routesMeta,
        collectedAt: summary.collectedAt,
        outDir,
        pageCount: summary.pageCount,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
    });

    return summary;
}

function verifyRouteCoverage(options) {
    const config = JSON.parse(fs.readFileSync(options.routesConfig, 'utf8'));
    config.samples = {
        ...(config.samples ?? {}),
        '[locale]': options.locale ?? config.locale ?? 'en',
    };

    const patterns = discoverRoutePatterns(options.appDir);
    const { uncovered, unmatchedPaths, configuredPaths, auditedPatterns } = auditRouteCoverage(patterns, config);

    console.log(`Audited ${auditedPatterns.length} App Router patterns (${patterns.length} total discovered).`);
    console.log(`Configured ${configuredPaths.length} concrete SSR paths.`);

    if (uncovered.length === 0) {
        console.log('OK: every auditable route pattern is covered by the config.');
    } else {
        console.error(`Missing coverage for ${uncovered.length} route pattern(s):`);
        for (const pattern of uncovered) {
            console.error(`  - ${pattern}`);
        }
    }

    if (unmatchedPaths.length > 0) {
        console.log('');
        console.log(`Note: ${unmatchedPaths.length} configured path(s) do not map to a discovered page route:`);
        for (const routePath of unmatchedPaths) {
            console.log(`  - ${routePath}`);
        }
    }

    if (uncovered.length > 0) {
        process.exit(1);
    }
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.verifyRoutes) {
        verifyRouteCoverage(options);
        return;
    }
    ensureDir(options.outDir);

    let pageResults;
    let routesMeta;

    if (options.analyzeOnly) {
        pageResults = loadSavedPages(options.outDir);
        routesMeta = fs.existsSync(path.join(options.outDir, 'manifest.json'))
            ? JSON.parse(fs.readFileSync(path.join(options.outDir, 'manifest.json'), 'utf8'))
            : { analyzeOnly: true };
        console.log(`Analyzing ${pageResults.length} saved pages in ${options.outDir} ...`);
    } else {
        const { config, patterns, routes } = loadRoutes(
            options.routesConfig,
            options.appDir,
            options.locale,
            options.configPathsOnly,
        );
        routesMeta = {
            baseUrl: options.baseUrl,
            locale: options.locale,
            routesConfig: options.routesConfig,
            discoveredPatternCount: patterns.length,
            routeCount: routes.length,
            routes: routes.map((route) => ({ path: route.path, pattern: route.pattern, source: route.source })),
            configPaths: resolveConfiguredPaths(config),
        };

        pageResults = await collectPages(options, routes);
    }

    const summary = writeAnalysis(options.outDir, pageResults, routesMeta);

    console.log('');
    console.log(`Done. Output: ${options.outDir}`);
    console.log(`  pages/          raw HTML + metadata`);
    console.log(`  analysis/report.md`);
    console.log(`  analysis/summary.json`);
    console.log('');
    console.log(
        `Summary: ${summary.successCount}/${summary.pageCount} ok, ${summary.totalHtmlBytes.toLocaleString()} HTML bytes, ~${summary.totalWastedBytesEstimate.toLocaleString()} bytes estimated duplicate waste`,
    );
}

main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    process.exit(1);
});
