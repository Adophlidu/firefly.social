import type { NetworkType } from '@/constants/enum.js';

export interface SwapToken {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
    logoURI?: string;
    balance?: string;
    usdValue?: number;
    price?: number;
    networkType?: NetworkType;
    isRiskToken?: boolean;
    marketCapUsd?: string;
    priceChange24h?: string;
}

export interface SupportedChain {
    chainId: number;
    chainName: string;
    networkType?: NetworkType;
    logoUrl?: string;
    nativeToken?: string;
}

export interface SwapQuote {
    fromToken: SwapToken;
    toToken: SwapToken;
    fromAmount: string;
    toAmount: string;
    rate: number;
    priceImpact?: string;
    minReceived?: string;
    gasEstimate?: string;
    gasUsd?: number;
    tx?: {
        to: string;
        data: string;
        value: string;
        gas?: string;
        gasPrice?: string;
    };
    routerAddress?: string;
}

export interface CrossChainQuote {
    fromToken: SwapToken;
    toToken: SwapToken;
    fromAmount: string;
    toAmount: string;
    rate: number;
    minReceived?: string;
    gasUsd?: number;
    estimatedTime?: number;
    bridgeProvider?: string;
}

export interface ApproveTransaction {
    to?: string;
    data: string;
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
    dexContractAddress?: string;
}

export interface SwapApiResponse<T> {
    code: number;
    data?: T;
    error?: string[];
    message?: string;
}

export interface AllTokensResponse {
    tokens: SwapToken[];
}

export interface UserTokenBalancesResponse {
    tokenAssets: SwapToken[];
}

export interface SupportedChainsResponse {
    chains: SupportedChain[];
}

export interface GetQuoteParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    fromDecimals: number;
    toChainId?: number;
    slippage?: string;
    userWalletAddress?: string;
}

export interface GetSwapParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    fromDecimals: number;
    toChainId?: number;
    slippage?: string;
    userWalletAddress: string;
}

export interface GetApproveParams {
    tokenAddress: string;
    amount: string;
    chainId: number;
    userWalletAddress: string;
    spender?: string;
}

export interface GetCrossChainQuoteParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    toChainId: number;
    fromDecimals: number;
    slippage?: string;
    userWalletAddress: string;
    recipientWalletAddress?: string;
}

export interface GetCrossChainBuildTxParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromChainId: number;
    toChainId: number;
    fromDecimals: number;
    slippage?: string;
    userWalletAddress: string;
    recipientWalletAddress?: string;
}

export interface CrossChainBuildTxResponse {
    fromTokenAmount: string;
    toTokenAmount: string;
    minimumReceive: string;
    tx: {
        data: string;
        from: string;
        to: string;
        value: string;
        gas?: string;
        gasPrice?: string;
    };
}

export interface SearchTokenParams {
    keyword: string;
    chain?: string;
}

export interface RecentTokenParams {
    chains?: string;
    size?: number;
    cursor?: string;
}

export interface RecentToken {
    chain_id: number;
    address?: string;
    logo?: string;
    symbol?: string;
    name: string;
    price?: string;
    price_change_24h?: string;
    market_cap_usd?: string;
    decimal: number;
    timestamp: number;
}

export interface RecentTokenResponse {
    list: RecentToken[];
    cursor?: string;
}

export interface SwapExecutionResult {
    success: boolean;
    hash?: string;
    error?: string;
}

export interface TokenWithBalance extends SwapToken {
    formattedBalance: string;
    formattedUsdValue: string;
    isNative: boolean;
}
