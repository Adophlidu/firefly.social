/* cspell:disable */
import { bom } from '@dimensiondev/utils';
import { z } from 'zod';

import { type NODE_ENV, STATUS, VERCEL_ENV } from '@/constants/enum.js';

const InternalEnvSchema = z.object({});

const ExternalEnvSchema = z.object({
    NEXT_PUBLIC_VERCEL_ENV: z.nativeEnum(VERCEL_ENV).default(VERCEL_ENV.Development),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().default('cmes01sbz00z7l60b51qqfg1x'),
    NEXT_PUBLIC_SITE_URL: z.string().default('https://firefly.social'),
    NEXT_PUBLIC_BASE_PATH: z.string().default('/wallet-iframe'),
    NEXT_PUBLIC_FIREFLY_ROOT_URL: z.string().default('https://api.firefly.land'),
    NEXT_PUBLIC_MAINNET_RPC_URL: z.string().default('https://eth.llamarpc.com'),
    NEXT_PUBLIC_OPTIMISM_RPC_URL: z.string().default('https://mainnet.optimism.io'),
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
    NEXT_PUBLIC_SOLANA_RPC_WS_URL: z.string().optional(),
    NEXT_PUBLIC_POLYGON_RPC_URL: z.string().default('https://polygon.drpc.org'),
    NEXT_PUBLIC_MONAD_TESTNET_RPC_URL: z.string().default('https://testnet-rpc.monad.xyz/'),
    NEXT_PUBLIC_FIREFLY_DEV_API: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_DEV_SITE: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_NFT_FEATURES: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_W3M_PROJECT_ID: z.string().default('invalid_w3m_project_id'),
});

// Helper to get env value from import.meta.env (client) or process.env (server)
function getEnvValue(key: string): string | undefined {
    // In Vite/TanStack Start, use import.meta.env for client-side
    if (import.meta?.env?.[key]) {
        return import.meta.env[key] as string | undefined;
    }
    // Fallback to process.env for SSR/Node
    return process.env[key];
}

export const env = {
    shared: {
        NODE_ENV: (getEnvValue('NODE_ENV') || process.env.NODE_ENV) as NODE_ENV,
        VERSION: process.env.npm_package_version || '',
        COMMIT_HASH: process.env.COMMIT_HASH,
    },
    internal: ((!bom.window || process.env.VITEST) &&
    !process.env.GITHUB_ACTIONS &&
    !('browser' in (process as unknown as { browser?: unknown }))
        ? InternalEnvSchema.parse(process.env)
        : {}) as z.infer<typeof InternalEnvSchema>,
    external: ExternalEnvSchema.parse({
        NEXT_PUBLIC_VERCEL_ENV: getEnvValue('NEXT_PUBLIC_VERCEL_ENV'),
        NEXT_PUBLIC_PRIVY_APP_ID: getEnvValue('NEXT_PUBLIC_PRIVY_APP_ID'),
        NEXT_PUBLIC_SITE_URL: getEnvValue('NEXT_PUBLIC_SITE_URL'),
        NEXT_PUBLIC_BASE_PATH: getEnvValue('NEXT_PUBLIC_BASE_PATH'),
        NEXT_PUBLIC_FIREFLY_ROOT_URL: getEnvValue('NEXT_PUBLIC_FIREFLY_ROOT_URL'),
        NEXT_PUBLIC_MAINNET_RPC_URL: getEnvValue('NEXT_PUBLIC_MAINNET_RPC_URL'),
        NEXT_PUBLIC_OPTIMISM_RPC_URL: getEnvValue('NEXT_PUBLIC_OPTIMISM_RPC_URL'),
        NEXT_PUBLIC_SOLANA_RPC_URL: getEnvValue('NEXT_PUBLIC_SOLANA_RPC_URL'),
        NEXT_PUBLIC_SOLANA_RPC_WS_URL: getEnvValue('NEXT_PUBLIC_SOLANA_RPC_WS_URL'),
        NEXT_PUBLIC_POLYGON_RPC_URL: getEnvValue('NEXT_PUBLIC_POLYGON_RPC_URL'),
        NEXT_PUBLIC_MONAD_TESTNET_RPC_URL: getEnvValue('NEXT_PUBLIC_MONAD_TESTNET_RPC_URL'),
        NEXT_PUBLIC_FIREFLY_DEV_API: getEnvValue('NEXT_PUBLIC_FIREFLY_DEV_API'),
        NEXT_PUBLIC_DEV_SITE: getEnvValue('NEXT_PUBLIC_DEV_SITE'),
        NEXT_PUBLIC_NFT_FEATURES: getEnvValue('NEXT_PUBLIC_NFT_FEATURES'),
        NEXT_PUBLIC_W3M_PROJECT_ID: getEnvValue('NEXT_PUBLIC_W3M_PROJECT_ID'),
    }),
};
