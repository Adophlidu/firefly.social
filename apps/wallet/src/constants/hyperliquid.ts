import type { Address } from 'viem';
import { arbitrum } from 'viem/chains';

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
