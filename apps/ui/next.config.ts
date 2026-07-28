import type { NextConfig } from 'next';

const config: NextConfig = {
    // This app is served under firefly.social/ui via a Next.js rewrite configured
    // in apps/web/.next-config/rewrite.config.json (same pattern as /wallet-iframe).
    basePath: '/ui',
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default config;
