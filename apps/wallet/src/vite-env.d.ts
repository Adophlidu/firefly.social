/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly NEXT_PUBLIC_VERCEL_ENV?: string;
    readonly NEXT_PUBLIC_PRIVY_APP_ID?: string;
    readonly NEXT_PUBLIC_SITE_URL?: string;
    readonly NEXT_PUBLIC_BASE_PATH?: string;
    readonly NEXT_PUBLIC_FIREFLY_ROOT_URL?: string;
    readonly NEXT_PUBLIC_MAINNET_RPC_URL?: string;
    readonly NEXT_PUBLIC_OPTIMISM_RPC_URL?: string;
    readonly NEXT_PUBLIC_SOLANA_RPC_URL?: string;
    readonly NEXT_PUBLIC_SOLANA_RPC_WS_URL?: string;
    readonly NEXT_PUBLIC_POLYGON_RPC_URL?: string;
    readonly NEXT_PUBLIC_MONAD_TESTNET_RPC_URL?: string;
    readonly NEXT_PUBLIC_FIREFLY_DEV_API?: string;
    readonly NEXT_PUBLIC_DEV_SITE?: string;
    readonly NEXT_PUBLIC_NFT_FEATURES?: string;
    readonly NODE_ENV?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
