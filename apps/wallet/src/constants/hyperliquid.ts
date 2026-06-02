import { NetworkType } from '@dimensiondev/enums';
import type { Address } from 'viem';
import { arbitrum } from 'viem/chains';

import type { SwapToken } from '@/providers/swap/types.js';

// -----------------------------------------------------------------------------
// L1 Info API (no SDK)
// @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
// -----------------------------------------------------------------------------

export const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';

// -----------------------------------------------------------------------------
// React Query — shared key segments (invalidate with prefix [HYPERLIQUID_QUERY_KEY_ROOT])
// -----------------------------------------------------------------------------

export const HYPERLIQUID_QUERY_KEY_ROOT = 'hyperliquid' as const;

/** Second segment: global spot meta + asset contexts. */
export const HYPERLIQUID_QUERY_SPOT_META_AND_ASSET_CTXS = 'spotMetaAndAssetCtxs' as const;

/** Second segment: bundled user info (abstraction + clearinghouse + spot state). */
export const HYPERLIQUID_QUERY_PERPS_ACCOUNT_BUNDLE = 'perpsAccountBundle' as const;

// -----------------------------------------------------------------------------
// Arbitrum One — native USDC used for Hyperliquid deposits
// -----------------------------------------------------------------------------

export const ARBITRUM_CHAIN_ID = arbitrum.id;

export const ARBITRUM_USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address;

export const ARBITRUM_USDC_DECIMALS = 6;

// -----------------------------------------------------------------------------
// Bridge / deposit (same addresses as OneKey `packages/shared/types/hyperliquid/perp.constants.ts`)
// -----------------------------------------------------------------------------

/** Official Hyperliquid deposit (bridge) contract on Arbitrum One. */
export const HYPERLIQUID_DEPOSIT_ADDRESS = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7' as Address;

/** Minimum deposit in USDC (UI convention aligned with OneKey). */
export const MIN_HYPERLIQUID_DEPOSIT_USDC = 5;

export const arbUsdcTokenFallback: SwapToken = {
    address: ARBITRUM_USDC_ADDRESS,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: ARBITRUM_USDC_DECIMALS,
    chainId: ARBITRUM_CHAIN_ID,
    logoURI: 'https://sdk-cdn.fun.xyz/images/usdc.svg',
    price: 1,
    networkType: NetworkType.Ethereum,
};

export function isArbitrumUsdcToken(chainId: number, address: string | undefined): boolean {
    return chainId === ARBITRUM_CHAIN_ID && address?.toLowerCase() === ARBITRUM_USDC_ADDRESS.toLowerCase();
}

export const TERMS_URL = 'https://app.hyperliquid.xyz/terms';
export const PRIVACY_URL = 'https://app.hyperliquid.xyz/privacyPolicy';
export const ABOUT_URL = 'https://hyperliquid.gitbook.io/hyperliquid-docs';
