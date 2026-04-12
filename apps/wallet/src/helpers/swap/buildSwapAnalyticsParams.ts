import type { SwapToken } from '@/providers/swap/types.js';
import type { SwapAccessPath } from '@/store/swap/swapState.js';

export interface SwapAnalyticsParams {
    wallet_address: string;
    wallet_type: string;
    wallet_name: string | undefined;
    time: string;
    sell_token: string;
    buy_token: string;
    amount_usd: string;
    chain_id: number;
    access_path: SwapAccessPath;
    sell_chain_id?: number;
    buy_chain_id?: number;
    tx_hash?: string;
    [key: string]: unknown;
}

export interface BuildSwapAnalyticsParamsInput {
    walletAddress: string;
    isSolana: boolean;
    solanaWalletName: string | undefined;
    evmWalletName: string | undefined;
    fromToken: SwapToken;
    toToken: SwapToken;
    fromAmount: string;
    fromChainId: number;
    toChainId: number;
    isCrossChain: boolean;
    accessPath: SwapAccessPath;
}

export function buildSwapAnalyticsParams(input: BuildSwapAnalyticsParamsInput): SwapAnalyticsParams {
    return {
        wallet_address: input.walletAddress,
        wallet_type: input.isSolana ? 'Sol' : 'EVM',
        wallet_name: input.isSolana ? input.solanaWalletName : input.evmWalletName,
        time: new Date().toISOString(),
        sell_token: input.fromToken.symbol,
        buy_token: input.toToken.symbol,
        amount_usd: input.fromToken.price ? (parseFloat(input.fromAmount) * input.fromToken.price).toString() : '',
        chain_id: input.fromChainId,
        access_path: input.accessPath,
        ...(input.isCrossChain ? { sell_chain_id: input.fromChainId, buy_chain_id: input.toChainId } : {}),
    };
}
