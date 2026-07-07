/**
 * Mainnet fallback endpoint — same URL (including the trailing slash) as
 * `web3.clusterApiUrl('mainnet-beta')` from `@solana/web3.js`.
 */
const SOLANA_MAINNET_BETA_RPC_URL = 'https://api.mainnet-beta.solana.com/';

/** Shared devnet HTTP endpoint when `useDevCluster` is true and no custom `devHttpUrl` is set. */
const DEFAULT_PUBLIC_SOLANA_DEV_HTTP_URL =
    'https://chaotic-solemn-sound.solana-devnet.quiknode.pro/4fc40f8f7d6d57cdc6735ea81a39e07f1fdafc2e';

interface GetSolanaRPCUrlParams {
    /** Primary HTTP RPC (e.g. from `NEXT_PUBLIC_SOLANA_RPC_URL`); falls back to mainnet cluster URL when absent. */
    httpUrl?: string | null | undefined;
    /** When true, returns the dev cluster URL (`devHttpUrl` or {@link DEFAULT_PUBLIC_SOLANA_DEV_HTTP_URL}). */
    useDevCluster?: boolean;
    /** Override dev HTTP URL when `useDevCluster` is true. */
    devHttpUrl?: string;
}

export function getSolanaRPCUrl(params?: GetSolanaRPCUrlParams): string {
    const { httpUrl, useDevCluster, devHttpUrl } = params ?? {};
    if (useDevCluster) return devHttpUrl ?? DEFAULT_PUBLIC_SOLANA_DEV_HTTP_URL;
    return httpUrl || SOLANA_MAINNET_BETA_RPC_URL;
}
