import { bom } from '@dimensiondev/utils';
import { z } from 'zod';

import { NODE_ENV, STATUS, VERCEL_ENV } from '@/constants/enum.js';

const InternalEnvSchema = z.object({
    TWITTER_CLIENT_ID: z.string(),
    TWITTER_CLIENT_SECRET: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    APPLE_CLIENT_ID: z.string(),
    APPLE_CLIENT_SECRET: z.string(),

    NEXTAUTH_SECRET: z.string(),

    SESSION_CIPHER_KEY: z.string(),
    SESSION_CIPHER_IV: z.string(),

    FARCASTER_SIGNER_FID: z.string(),
    FARCASTER_SIGNER_MNEMONIC: z.string(),

    FIREFLY_JWT_SECRET: z.string(),

    ORB_API_KEY: z.string(),

    // Protection Bypass
    INTERNAL_STATIC_REQUEST_BYPASS: z.string().optional(),
});

const ExternalEnvSchema = z.object({
    NEXT_PUBLIC_VERCEL_ENV: z.nativeEnum(VERCEL_ENV).default(VERCEL_ENV.Development),

    // urls
    NEXT_PUBLIC_SITE_URL: z.string().default('https://firefly.social'),
    NEXT_PUBLIC_SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),

    // features
    NEXT_PUBLIC_ACTIVITY_PARTICLE: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_COMPOSE_GIF: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_FIREFLY_DEV_API: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_IFRAME_BRIDGE: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_FORCE_SIGNUP: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_FRAME_V1: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_FRAME_V2: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_FRAME: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_NITTER: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_OPENGRAPH: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_POLL: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_POST_BY_ANONYMOUS: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_POST_TRANSLATE: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_PRIVY: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_API_PERFORMANCE_PROFILING: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_SCHEDULE_POST: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_SOLANA_DEV: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_TELEMETRY: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_THIRD_PARTY_AUTH: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_TIPS: z.nativeEnum(STATUS).default(STATUS.Enabled),
    NEXT_PUBLIC_WALLET_MIX: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_SPARKS: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_LENS_SIGNUP: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_FARCASTER_SIGNUP: z.nativeEnum(STATUS).default(STATUS.Disabled),
    NEXT_PUBLIC_NFT_FEATURES: z.nativeEnum(STATUS).default(STATUS.Enabled),

    // sentry
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_REPORT_URL: z.string().optional(),

    // app url scheme
    NEXT_PUBLIC_FIREFLY_DOWNLOAD_LINK: z.string().default('https://5euxu.app.link/PHvNiyVemIb'),

    // gif
    NEXT_PUBLIC_GIPHY_API_KEY: z.string().default('invalid_giphy_api_key'),
    NEXT_PUBLIC_TENOR_API_KEY: z.string().default('LIVDSRZULELA'),

    // w3m
    NEXT_PUBLIC_W3M_PROJECT_ID: z.string().default('invalid_w3m_project_id'),

    // firebase
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),

    // lens
    NEXT_PUBLIC_LENS_APP_ADDRESS: z.string().optional(),

    // passcode
    NEXT_PUBLIC_PASSCODE_PUBLIC_KEY: z.string().default('invalid_passcode_public_key'),
    NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING: z.string().default('invalid_passcode_public_key_staging'),
    NEXT_PUBLIC_PASSCODE_IV: z.string().default('invalid_passcode_iv'),
});

export const env = {
    shared: {
        NODE_ENV: process.env.NODE_ENV as NODE_ENV,
        VERSION: process.env.npm_package_version || '',
        COMMIT_HASH: process.env.COMMIT_HASH,
    },
    internal: ((!bom.window || process.env.VITEST) && !process.env.GITHUB_ACTIONS && !('browser' in (process as any))
        ? InternalEnvSchema.parse(process.env)
        : {}) as z.infer<typeof InternalEnvSchema>,
    external: ExternalEnvSchema.parse({
        NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,

        // urls
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,

        // features
        NEXT_PUBLIC_ACTIVITY_PARTICLE: process.env.NEXT_PUBLIC_ACTIVITY_PARTICLE,
        NEXT_PUBLIC_COMPOSE_GIF: process.env.NEXT_PUBLIC_COMPOSE_GIF,
        NEXT_PUBLIC_FIREFLY_DEV_API: process.env.NEXT_PUBLIC_FIREFLY_DEV_API,
        NEXT_PUBLIC_IFRAME_BRIDGE: process.env.NEXT_PUBLIC_IFRAME_BRIDGE,
        NEXT_PUBLIC_FORCE_SIGNUP: process.env.NEXT_PUBLIC_FORCE_SIGNUP,
        NEXT_PUBLIC_FRAME_V1: process.env.NEXT_PUBLIC_FRAME_V1,
        NEXT_PUBLIC_FRAME_V2: process.env.NEXT_PUBLIC_FRAME_V2,
        NEXT_PUBLIC_FRAME: process.env.NEXT_PUBLIC_FRAME,
        NEXT_PUBLIC_NITTER: process.env.NEXT_PUBLIC_NITTER,
        NEXT_PUBLIC_OPENGRAPH: process.env.NEXT_PUBLIC_OPENGRAPH,
        NEXT_PUBLIC_POLL: process.env.NEXT_PUBLIC_POLL,
        NEXT_PUBLIC_POST_BY_ANONYMOUS: process.env.NEXT_PUBLIC_POST_BY_ANONYMOUS,
        NEXT_PUBLIC_POST_TRANSLATE: process.env.NEXT_PUBLIC_POST_TRANSLATE,
        NEXT_PUBLIC_PRIVY: process.env.NEXT_PUBLIC_PRIVY,
        NEXT_PUBLIC_API_PERFORMANCE_PROFILING: process.env.NEXT_PUBLIC_API_PERFORMANCE_PROFILING,
        NEXT_PUBLIC_SCHEDULE_POST: process.env.NEXT_PUBLIC_SCHEDULE_POST,
        NEXT_PUBLIC_SOLANA_DEV: process.env.NEXT_PUBLIC_SOLANA_DEV,
        NEXT_PUBLIC_TELEMETRY: process.env.NEXT_PUBLIC_TELEMETRY,
        NEXT_PUBLIC_THIRD_PARTY_AUTH: process.env.NEXT_PUBLIC_THIRD_PARTY_AUTH,
        NEXT_PUBLIC_TIPS: process.env.NEXT_PUBLIC_TIPS,
        NEXT_PUBLIC_WALLET_MIX: process.env.NEXT_PUBLIC_WALLET_MIX,
        NEXT_PUBLIC_SPARKS: process.env.NEXT_PUBLIC_SPARKS,
        NEXT_PUBLIC_LENS_SIGNUP: process.env.NEXT_PUBLIC_LENS_SIGNUP,
        NEXT_PUBLIC_FARCASTER_SIGNUP: process.env.NEXT_PUBLIC_FARCASTER_SIGNUP,
        NEXT_PUBLIC_NFT_FEATURES: process.env.NEXT_PUBLIC_NFT_FEATURES,

        // sentry
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_SENTRY_REPORT_URL: process.env.NEXT_PUBLIC_SENTRY_REPORT_URL,

        // app scheme url
        NEXT_PUBLIC_FIREFLY_DOWNLOAD_LINK: process.env.NEXT_PUBLIC_FIREFLY_DOWNLOAD_LINK,

        // gif
        NEXT_PUBLIC_GIPHY_API_KEY: process.env.NEXT_PUBLIC_GIPHY_API_KEY,
        NEXT_PUBLIC_TENOR_API_KEY: process.env.NEXT_PUBLIC_TENOR_API_KEY,

        // w3m
        NEXT_PUBLIC_W3M_PROJECT_ID: process.env.NEXT_PUBLIC_W3M_PROJECT_ID,

        // firebase
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,

        // lens
        NEXT_PUBLIC_LENS_APP_ADDRESS: process.env.NEXT_PUBLIC_LENS_APP_ADDRESS,

        // passcode
        NEXT_PUBLIC_PASSCODE_PUBLIC_KEY: process.env.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY,
        NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING: process.env.NEXT_PUBLIC_PASSCODE_PUBLIC_KEY_STAGING,
        NEXT_PUBLIC_PASSCODE_IV: process.env.NEXT_PUBLIC_PASSCODE_IV,
    }),
};
