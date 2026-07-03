/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly NEXT_PUBLIC_VERCEL_ENV?: string;
    readonly NEXT_PUBLIC_PRIVY_APP_ID?: string;
    readonly NEXT_PUBLIC_SITE_URL?: string;
    readonly NEXT_PUBLIC_BASE_PATH?: string;
    readonly NEXT_PUBLIC_FIREFLY_ROOT_URL?: string;
    readonly NEXT_PUBLIC_FIREFLY_DEV_API?: string;
    readonly NEXT_PUBLIC_DEV_SITE?: string;
    readonly NEXT_PUBLIC_NFT_FEATURES?: string;
    readonly NEXT_PUBLIC_PERPS_FEATURES?: string;
    readonly NEXT_PUBLIC_PIN_CODE?: string;
    readonly NODE_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
