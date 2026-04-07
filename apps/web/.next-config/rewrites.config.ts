import { existsSync, readFileSync } from 'fs';
import { type NextConfig } from 'next';
import { resolve } from 'path';

type DeploymentTier = 'production' | 'canary' | 'staging';

function getDeploymentTier(): DeploymentTier {
    if (process.env.VERCEL_ENV === 'production') return 'production';
    if (process.env.VERCEL_GIT_COMMIT_REF?.startsWith('bump-version-')) return 'canary';
    return 'staging';
}

export const rewritesConfig: NonNullable<NextConfig['rewrites']> = async () => {
    const tier = getDeploymentTier();
    const rules: Array<{ source: string; destination: string }> = [];

    // Route table from rewrite.config.json — maps path prefixes to full per-environment destination URLs.
    // Format: { "/path": { "staging": "https://host/path", "canary": "https://host/path/", ... } }
    // Destinations include the full path and trailing slash as required by the target app.
    let proxyRoutes: Record<string, Record<DeploymentTier, string>>;
    try {
        proxyRoutes = JSON.parse(readFileSync(resolve(import.meta.dirname, 'rewrite.config.json'), 'utf-8'));
    } catch (err) {
        throw new Error(`[rewrites.config] Failed to parse rewrite.config.json: ${err}`);
    }

    const routes = new Map<string, string>();
    for (const [path, destinations] of Object.entries(proxyRoutes)) {
        const destination = destinations[tier];
        if (!destination) {
            throw new Error(
                `[rewrites.config] Missing "${tier}" destination for path "${path}" in rewrite.config.json`,
            );
        }
        routes.set(path, destination);
    }

    // Local-dev overrides from .next-config/rewrite.config.dev.json (git-ignored).
    // Format: { "/path": "http://localhost:PORT/path" } — full destination URL for the paths you want to override.
    const devConfigPath = resolve(import.meta.dirname, 'rewrite.config.dev.json');
    if (existsSync(devConfigPath)) {
        const devOverrides: Record<string, string> = JSON.parse(readFileSync(devConfigPath, 'utf-8'));
        for (const [path, destination] of Object.entries(devOverrides)) {
            routes.set(path, destination);
        }
    }

    for (const [path, destination] of routes) {
        const base = destination.replace(/\/$/, '');
        rules.push({ source: path, destination }, { source: `${path}/:path*`, destination: `${base}/:path*` });
    }

    return rules;
};
