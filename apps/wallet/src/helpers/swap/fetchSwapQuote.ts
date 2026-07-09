import { isSolanaChain } from '@dimensiondev/web3/chains';

import type { SwapEndpoint } from '@/providers/swap/swapEndpoint.js';

export interface QuoteTxResult {
    tx: {
        to: string;
        data: string;
        value: string;
        gas?: string;
        gasPrice?: string;
    };
}

interface FetchSwapQuoteParams {
    endpoint: SwapEndpoint;
    isCrossChain: boolean;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    toChainId: number;
    fromDecimals: number;
    slippagePercent: string;
    walletAddress: string;
    recipientAddress?: string;
}

export async function fetchSwapQuote(params: FetchSwapQuoteParams): Promise<QuoteTxResult> {
    const {
        endpoint,
        isCrossChain,
        fromTokenAddress,
        toTokenAddress,
        amount,
        fromChainId,
        toChainId,
        fromDecimals,
        slippagePercent,
        walletAddress,
        recipientAddress,
    } = params;

    // All EVM swaps route through the cross-chain endpoint (the OKX aggregator does not cover
    // every EVM chain, e.g. Robinhood). Solana same-chain keeps the aggregator/Jupiter path.
    const useCrossChainEndpoint = isCrossChain || !isSolanaChain(fromChainId);

    const result = useCrossChainEndpoint
        ? await endpoint.getCrossChainBuildTx({
              fromTokenAddress,
              toTokenAddress,
              amount,
              fromChainId,
              toChainId,
              fromDecimals,
              slippage: slippagePercent,
              userWalletAddress: walletAddress,
              recipientWalletAddress: recipientAddress,
          })
        : await endpoint.getSwapTransaction({
              fromTokenAddress,
              toTokenAddress,
              amount,
              fromChainId,
              fromDecimals,
              toChainId,
              slippage: slippagePercent,
              userWalletAddress: walletAddress,
              swapReceiverAddress: recipientAddress,
          });

    if (!result?.tx) {
        throw new Error('Failed to get swap transaction data');
    }

    return result as QuoteTxResult;
}
