import { existsSync, readFileSync } from 'fs';
import type { NextConfig } from 'next';
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

    // Route table from rewrite.config.json — maps path prefixes to per-environment destinations.
    // Format: { "/path": { "staging": "https://...", "canary": "https://...", "production": "https://..." } }
    const proxyRoutes: Record<string, Record<DeploymentTier, string>> = JSON.parse(
        readFileSync(resolve(import.meta.dirname, 'rewrite.config.json'), 'utf-8'),
    );

    const routes = new Map<string, string>();
    for (const [path, destinations] of Object.entries(proxyRoutes)) {
        routes.set(path, destinations[tier]);
    }

    // Local-dev overrides from .next-config/rewrite.config.dev.json (git-ignored).
    // Format: { "/path": "http://localhost:PORT" } — only the paths you want to override.
    const devConfigPath = resolve(import.meta.dirname, 'rewrite.config.dev.json');
    if (existsSync(devConfigPath)) {
        const devOverrides: Record<string, string> = JSON.parse(readFileSync(devConfigPath, 'utf-8'));
        for (const [path, destination] of Object.entries(devOverrides)) {
            routes.set(path, destination);
        }
    }

    for (const [path, baseUrl] of routes) {
        rules.push(
            { source: path, destination: `${baseUrl}${path}` },
            { source: `${path}/:path*`, destination: `${baseUrl}${path}/:path*` },
        );
    }

    return rules;
};
