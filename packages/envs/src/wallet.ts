import type { NODE_ENV } from '@dimensiondev/enums';
import { STATUS, VERCEL_ENV } from '@dimensiondev/enums';
import { z } from 'zod';

// Dynamic process.env[key] omitted: vite-plugin-node-polyfills injects a shim that can't resolve from packages/envs during wallet SSR builds.
function getEnvValue(key: string): string | undefined {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
    return viteEnv?.[key];
}

const ExternalEnvSchema = z.object({
    NEXT_PUBLIC_VERCEL_ENV: z.nativeEnum(VERCEL_ENV).default(VERCEL_ENV.Development),
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().default('cmes01sbz00z7l60b51qqfg1x'),
    NEXT_PUBLIC_SITE_URL: z.string().default('https://firefly.social'),
    NEXT_PUBLIC_BASE_PATH: z.string().default('/wallet-iframe'),
    NEXT_PUBLIC_FIREFLY_ROOT_URL: z.string().default('https://api.firefly.land'),
    NEXT_PUBLIC_KLINE_BASE_URL: z.string().default('/wallet-iframe'),
    NEXT_PUBLIC_FIREFLY_DEV_API: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_FIREFLY_JWT_V3: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_DEV_SITE: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_PERPS_FEATURES: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_PIN_CODE: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_W3M_PROJECT_ID: z.string().default('invalid_w3m_project_id'),
});

export const envs = {
    shared: {
        NODE_ENV: (getEnvValue('NODE_ENV') || process.env.NODE_ENV) as NODE_ENV,
        VERSION: process.env.npm_package_version || '',
        COMMIT_HASH: process.env.COMMIT_HASH,
    },
    internal: {} as Record<never, never>,
    external: ExternalEnvSchema.parse({
        NEXT_PUBLIC_VERCEL_ENV: getEnvValue('NEXT_PUBLIC_VERCEL_ENV'),
        NEXT_PUBLIC_PRIVY_APP_ID: getEnvValue('NEXT_PUBLIC_PRIVY_APP_ID'),
        NEXT_PUBLIC_SITE_URL: getEnvValue('NEXT_PUBLIC_SITE_URL'),
        NEXT_PUBLIC_BASE_PATH: getEnvValue('NEXT_PUBLIC_BASE_PATH') ?? '/wallet-iframe',
        NEXT_PUBLIC_KLINE_BASE_URL: getEnvValue('NEXT_PUBLIC_KLINE_BASE_URL'),
        NEXT_PUBLIC_FIREFLY_ROOT_URL: getEnvValue('NEXT_PUBLIC_FIREFLY_ROOT_URL'),
        NEXT_PUBLIC_FIREFLY_DEV_API: getEnvValue('NEXT_PUBLIC_FIREFLY_DEV_API'),
        NEXT_PUBLIC_FIREFLY_JWT_V3: getEnvValue('NEXT_PUBLIC_FIREFLY_JWT_V3'),
        NEXT_PUBLIC_DEV_SITE: getEnvValue('NEXT_PUBLIC_DEV_SITE'),
        NEXT_PUBLIC_PERPS_FEATURES: getEnvValue('NEXT_PUBLIC_PERPS_FEATURES'),
        NEXT_PUBLIC_PIN_CODE: getEnvValue('NEXT_PUBLIC_PIN_CODE'),
        NEXT_PUBLIC_W3M_PROJECT_ID: getEnvValue('NEXT_PUBLIC_W3M_PROJECT_ID'),
    }),
};

export const APP_BASE_PATH = envs.external.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '');
export const IS_DEV_API = envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL.startsWith('https://api-dev.firefly.land');
