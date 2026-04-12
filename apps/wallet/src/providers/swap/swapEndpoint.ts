import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { leftShift, rightShift } from '@/helpers/number.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { Fetch } from '@/lib/Fetch.js';
import { normalizeSwapToken } from '@/providers/swap/normalizeSwapToken.js';
import type {
    ApproveTransaction,
    CrossChainBuildTxResponse,
    CrossChainQuote,
    GetApproveParams,
    GetCrossChainBuildTxParams,
    GetCrossChainQuoteParams,
    GetQuoteParams,
    GetSwapParams,
    RecentToken,
    RecentTokenParams,
    RecentTokenResponse,
    SearchTokenParams,
    SupportedChain,
    SwapApiResponse,
    SwapQuote,
    SwapToken,
} from '@/providers/swap/types.js';

// Raw OKX token shape from the backend (via OKX API)
interface RawOkxToken {
    tokenContractAddress: string;
    tokenSymbol: string;
    tokenName?: string;
    decimal: string;
    tokenUnitPrice?: string;
    tokenLogoUrl?: string;
}

// Raw quote response shape from backend (inner data array element)
interface RawQuoteData {
    chainId?: string;
    fromToken: RawOkxToken;
    toToken: RawOkxToken;
    fromTokenAmount: string;
    toTokenAmount: string;
    tradeFee?: string;
}

// Raw swap response shape from backend (inner data array element)
interface RawSwapData {
    routerResult: RawQuoteData & {
        dexRouterList?: unknown[];
    };
    tx: {
        to: string;
        data: string;
        value: string;
        gas?: string;
        gasPrice?: string;
    };
}

// Raw cross-chain quote response from backend
interface RawCrossChainQuoteData {
    fromTokenAmount?: string;
    toTokenAmount?: string;
    fromToken?: {
        chainId?: string;
        tokenContractAddress?: string;
        tokenSymbol?: string;
        tokenName?: string;
        logo?: string;
        decimal?: string;
        tokenUnitPrice?: string;
    };
    toToken?: {
        chainId?: string;
        tokenContractAddress?: string;
        tokenSymbol?: string;
        tokenName?: string;
        logo?: string;
        decimal?: string;
        tokenUnitPrice?: string;
    };
    estimateGasFee?: string;
    tradeFee?: string;
    tx?: {
        from?: string;
        to?: string;
        gasPrice?: string;
        gas?: string;
        value?: string;
        data?: string;
        minReceiveAmount?: string;
    };
}

// Inner response from the swap service (before TransformInterceptor wrapping)
interface InnerSwapResponse<T> {
    code: string;
    data?: T[];
    msg: string;
}

// Raw supported chain shape from the backend
interface RawSupportedChain {
    chainId: string;
    chainName: string;
    chainLogo: string;
}

interface RawTokenListItem {
    tokenSymbol: string;
    tokenName: string;
    tokenLogoUrl?: string;
    tokenContractAddress: string;
    decimals: string;
    chainIndex: string;
    tokenPrice?: string;
    tokenPriceChange24h?: string;
    marketCapUsd?: string;
}

interface RawTrendingToken {
    token_price?: string;
    price_change?: {
        m5?: string;
        m15?: string;
        m30?: string;
        h1?: string;
        h6?: string;
        h24?: string;
    };
    market_cap_usd?: string;
    token_symbol?: string;
    token_name?: string;
    token_icon?: string;
    token_address?: string;
    token_decimal?: number;
    chain_id_num?: number;
}

function mapRawTokenToSwapToken(raw: RawOkxToken, chainId: number): SwapToken {
    return normalizeSwapToken({
        address: raw.tokenContractAddress,
        symbol: raw.tokenSymbol,
        name: raw.tokenName ?? raw.tokenSymbol,
        decimals: parseInt(raw.decimal, 10) || 18,
        chainId,
        logoURI: raw.tokenLogoUrl,
        price: raw.tokenUnitPrice ? parseFloat(raw.tokenUnitPrice) : undefined,
    });
}

interface RawTokenAsset {
    chainIndex: string;
    tokenAddress: string;
    address: string; // wallet address that holds this token
    symbol: string;
    name: string;
    decimals: string;
    balance: string;
    tokenPrice?: string;
    tokenLogoUrl?: string;
    isRiskToken?: boolean;
    hide?: boolean;
}

export class SwapEndpoint extends Fetch {
    // Get supported chains for swap
    // API returns: { code: 0, data: { code: "0", data: [{ chainId: "1", chainName, chainLogo }] } }
    async getSupportedChains(): Promise<SupportedChain[]> {
        const result = await this.get<SwapApiResponse<InnerSwapResponse<RawSupportedChain>>>(
            '/swap/dex/aggregator/supported/chain',
        );

        if (!result.ok || result.data.code !== 0) {
            return [];
        }

        const rawChains = result.data.data?.data ?? [];

        return rawChains.map((chain) => ({
            chainId: parseInt(chain.chainId, 10),
            chainName: chain.chainName,
            logoUrl: chain.chainLogo,
        }));
    }

    // Get swap quote
    // Backend response is double-wrapped: TransformInterceptor { code: 0, data: SwapService { code: "0", data: [...] } }
    async getSwapQuote(params: GetQuoteParams): Promise<SwapQuote | null> {
        // Convert user decimal amount to smallest units (e.g., 0.1 ETH → 100000000000000000)
        const amountInSmallest = rightShift(params.amount, params.fromDecimals).toFixed(0);
        const url = urlcat('/swap/dex/aggregator/quote', {
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: amountInSmallest,
            chainId: params.fromChainId,
            slippage: params.slippage ?? '0.5',
            userWalletAddress: params.userWalletAddress,
        });
        const result = await this.get<SwapApiResponse<InnerSwapResponse<RawQuoteData>>>(url);
        if (!result.ok || result.data.code !== 0) {
            return null;
        }
        const inner = result.data.data;
        if (inner?.code !== '0' || !inner.data?.length) {
            return null;
        }
        const raw = inner.data[0];
        const chainId = params.fromChainId;
        const fromDecimals = parseInt(raw.fromToken.decimal, 10) || 18;
        const toDecimals = parseInt(raw.toToken.decimal, 10) || 18;
        // Convert amounts from smallest units back to decimal
        const fromAmountDecimal = leftShift(raw.fromTokenAmount, fromDecimals).toFixed();
        const toAmountDecimal = leftShift(raw.toTokenAmount, toDecimals).toFixed();
        const fromAmountNum = parseFloat(fromAmountDecimal);
        const toAmountNum = parseFloat(toAmountDecimal);
        // Calculate min received based on slippage
        const slippagePercent = parseFloat(params.slippage ?? '0.5');
        const minReceived = (toAmountNum * (1 - slippagePercent / 100)).toFixed(Math.min(toDecimals, 8));
        return {
            fromToken: mapRawTokenToSwapToken(raw.fromToken, chainId),
            toToken: mapRawTokenToSwapToken(raw.toToken, chainId),
            fromAmount: fromAmountDecimal,
            toAmount: toAmountDecimal,
            rate: fromAmountNum > 0 ? toAmountNum / fromAmountNum : 0,
            gasUsd: raw.tradeFee ? parseFloat(raw.tradeFee) : undefined,
            minReceived,
        };
    }

    // Execute swap - get transaction data
    // Backend response is double-wrapped: TransformInterceptor { code: 0, data: SwapService { code: "0", data: [...] } }
    async getSwapTransaction(params: GetSwapParams): Promise<SwapQuote | null> {
        // Convert user decimal amount to smallest units
        const amountInSmallest = rightShift(params.amount, params.fromDecimals).toFixed(0);
        const url = urlcat('/swap/dex/aggregator/swap', {
            fromTokenAddress: params.fromTokenAddress,
            toTokenAddress: params.toTokenAddress,
            amount: amountInSmallest,
            chainId: params.fromChainId,
            slippage: params.slippage ?? '0.5',
            userWalletAddress: params.userWalletAddress,
        });
        const result = await this.get<SwapApiResponse<InnerSwapResponse<RawSwapData>>>(url);
        if (!result.ok || result.data.code !== 0) {
            return null;
        }
        const inner = result.data.data;
        if (inner?.code !== '0' || !inner.data?.length) {
            return null;
        }
        const raw = inner.data[0];
        const chainId = params.fromChainId;
        const fromDecimals = parseInt(raw.routerResult.fromToken.decimal, 10) || 18;
        const toDecimals = parseInt(raw.routerResult.toToken.decimal, 10) || 18;
        // Convert amounts from smallest units back to decimal
        const fromAmountDecimal = leftShift(raw.routerResult.fromTokenAmount, fromDecimals).toFixed();
        const toAmountDecimal = leftShift(raw.routerResult.toTokenAmount, toDecimals).toFixed();
        const fromAmountNum = parseFloat(fromAmountDecimal);
        const toAmountNum = parseFloat(toAmountDecimal);
        // Calculate min received based on slippage
        const slippagePercent = parseFloat(params.slippage ?? '0.5');
        const minReceived = (toAmountNum * (1 - slippagePercent / 100)).toFixed(Math.min(toDecimals, 8));
        return {
            fromToken: mapRawTokenToSwapToken(raw.routerResult.fromToken, chainId),
            toToken: mapRawTokenToSwapToken(raw.routerResult.toToken, chainId),
            fromAmount: fromAmountDecimal,
            toAmount: toAmountDecimal,
            rate: fromAmountNum > 0 ? toAmountNum / fromAmountNum : 0,
            gasUsd: raw.routerResult.tradeFee ? parseFloat(raw.routerResult.tradeFee) : undefined,
            tx: raw.tx,
            routerAddress: raw.tx.to,
            minReceived,
        };
    }

    // Get approve transaction data
    // Backend response is double-wrapped: TransformInterceptor { code: 0, data: SwapService { code: "0", data: [...] } }
    async getApproveTransaction(params: GetApproveParams): Promise<ApproveTransaction | null> {
        const url = urlcat('/swap/dex/aggregator/approve-transaction', {
            tokenContractAddress: params.tokenAddress,
            approveAmount: params.amount,
            chainId: params.chainId,
            userWalletAddress: params.userWalletAddress,
            spender: params.spender,
        });
        const result = await this.get<SwapApiResponse<InnerSwapResponse<ApproveTransaction>>>(url);
        if (!result.ok || result.data.code !== 0) {
            return null;
        }
        const inner = result.data.data;
        if (inner?.code !== '0' || !inner.data?.length) {
            return null;
        }
        return inner.data[0] ?? null;
    }

    // Get cross-chain bridge quote (POST method as per backend)
    async getCrossChainQuote(params: GetCrossChainQuoteParams): Promise<CrossChainQuote | null> {
        // Convert user decimal amount to smallest units (e.g., 0.1 ETH → 100000000000000000)
        const amountInSmallest = rightShift(params.amount, params.fromDecimals).toFixed(0);
        const result = await this.post<SwapApiResponse<RawCrossChainQuoteData>>('/swap/dex/cross-chain/quote', {
            originChainId: String(params.fromChainId),
            destinationChainId: String(params.toChainId),
            originCurrency: params.fromTokenAddress,
            destinationCurrency: params.toTokenAddress,
            amount: amountInSmallest,
            slippage: params.slippage ?? '0.5',
            user: params.userWalletAddress,
            recipient: params.recipientWalletAddress ?? params.userWalletAddress,
        });
        if (!result.ok || result.data.code !== 0 || !result.data.data) {
            return null;
        }

        const raw = result.data.data;
        const fromChainId = params.fromChainId;
        const toChainId = params.toChainId;

        // Map raw tokens to SwapToken format
        const fromToken: SwapToken = raw.fromToken
            ? normalizeSwapToken({
                  address: raw.fromToken.tokenContractAddress ?? params.fromTokenAddress,
                  symbol: raw.fromToken.tokenSymbol ?? '',
                  name: raw.fromToken.tokenName ?? raw.fromToken.tokenSymbol ?? '',
                  decimals: parseInt(raw.fromToken.decimal ?? '18', 10) || 18,
                  chainId: fromChainId,
                  logoURI: raw.fromToken.logo,
                  price: raw.fromToken.tokenUnitPrice ? parseFloat(raw.fromToken.tokenUnitPrice) : undefined,
              })
            : normalizeSwapToken({
                  address: params.fromTokenAddress,
                  symbol: '',
                  name: '',
                  decimals: 18,
                  chainId: fromChainId,
              });

        const toToken: SwapToken = raw.toToken
            ? normalizeSwapToken({
                  address: raw.toToken.tokenContractAddress ?? params.toTokenAddress,
                  symbol: raw.toToken.tokenSymbol ?? '',
                  name: raw.toToken.tokenName ?? raw.toToken.tokenSymbol ?? '',
                  decimals: parseInt(raw.toToken.decimal ?? '18', 10) || 18,
                  chainId: toChainId,
                  logoURI: raw.toToken.logo,
                  price: raw.toToken.tokenUnitPrice ? parseFloat(raw.toToken.tokenUnitPrice) : undefined,
              })
            : normalizeSwapToken({
                  address: params.toTokenAddress,
                  symbol: '',
                  name: '',
                  decimals: 18,
                  chainId: toChainId,
              });

        // Convert amounts from smallest units back to decimal
        const fromAmountDecimal = leftShift(raw.fromTokenAmount ?? '0', fromToken.decimals).toFixed();
        const toAmountDecimal = leftShift(raw.toTokenAmount ?? '0', toToken.decimals).toFixed();
        const fromAmountNum = parseFloat(fromAmountDecimal);
        const toAmountNum = parseFloat(toAmountDecimal);

        // Get min received from tx.minReceiveAmount or calculate from slippage
        const slippagePercent = parseFloat(params.slippage ?? '0.5');
        const minReceived = raw.tx?.minReceiveAmount
            ? leftShift(raw.tx.minReceiveAmount, toToken.decimals).toFixed()
            : (toAmountNum * (1 - slippagePercent / 100)).toFixed(Math.min(toToken.decimals, 8));

        return {
            fromToken,
            toToken,
            fromAmount: fromAmountDecimal,
            toAmount: toAmountDecimal,
            rate: fromAmountNum > 0 ? toAmountNum / fromAmountNum : 0,
            minReceived,
            gasUsd: raw.tradeFee ? parseFloat(raw.tradeFee) : undefined,
        };
    }

    // Build cross-chain swap transaction (uses same endpoint as quote)
    async getCrossChainBuildTx(params: GetCrossChainBuildTxParams): Promise<CrossChainBuildTxResponse | null> {
        // Convert user decimal amount to smallest units (e.g., 0.1 ETH → 100000000000000000)
        const amountInSmallest = rightShift(params.amount, params.fromDecimals).toFixed(0);
        const result = await this.post<SwapApiResponse<RawCrossChainQuoteData>>('/swap/dex/cross-chain/quote', {
            originChainId: String(params.fromChainId),
            destinationChainId: String(params.toChainId),
            originCurrency: params.fromTokenAddress,
            destinationCurrency: params.toTokenAddress,
            amount: amountInSmallest,
            slippage: params.slippage ?? '0.5',
            user: params.userWalletAddress,
            recipient: params.recipientWalletAddress ?? params.userWalletAddress,
        });
        if (!result.ok || result.data.code !== 0 || !result.data.data) {
            return null;
        }

        const raw = result.data.data;
        if (!raw.tx) {
            return null;
        }

        return {
            fromTokenAmount: raw.fromTokenAmount ?? '',
            toTokenAmount: raw.toTokenAmount ?? '',
            minimumReceive: raw.tx.minReceiveAmount ?? '',
            tx: {
                data: raw.tx.data ?? '',
                from: raw.tx.from ?? '',
                to: raw.tx.to ?? '',
                value: raw.tx.value ?? '',
                gas: raw.tx.gas,
                gasPrice: raw.tx.gasPrice,
            },
        };
    }

    // Get user token balances
    // API response is double-wrapped: { code: 0, data: { code: "0", data: { tokenAssets: [...] } } }
    async getUserTokenBalances(walletAddress: string, chainIds?: number[]): Promise<SwapToken[]> {
        const url = urlcat('/swap/wallet/asset/muti-chain', {
            addresses: walletAddress,
            chains: chainIds?.join(','),
        });
        const result = await this.get<SwapApiResponse<SwapApiResponse<{ tokenAssets: RawTokenAsset[] }>>>(url);
        const outer = resolveFireflyResponseData(result.data);
        const rawAssets = outer?.data?.tokenAssets ?? [];

        return rawAssets.map((t) =>
            normalizeSwapToken({
                address: t.tokenAddress,
                symbol: t.symbol,
                name: t.name,
                decimals: parseInt(t.decimals, 10) || 18,
                chainId: parseInt(t.chainIndex, 10),
                logoURI: t.tokenLogoUrl,
                balance: t.balance,
                price: t.tokenPrice ? parseFloat(t.tokenPrice) : undefined,
                isRiskToken: t.isRiskToken,
            }),
        );
    }

    // Get user token balances across multiple wallets and chains
    // API response is double-wrapped: { code: 0, data: { code: "0", data: { tokenAssets: [...] } } }
    // Each tokenAsset includes an `address` field identifying the wallet that holds the token.
    async getUserTokenBalancesMultiChain(addresses: string[], chainIds: number[]): Promise<Map<string, SwapToken[]>> {
        const url = urlcat('/swap/wallet/asset/muti-chain', {
            addresses: addresses.join(','),
            chains: chainIds.join(','),
        });
        const result = await this.get<SwapApiResponse<SwapApiResponse<{ tokenAssets: RawTokenAsset[] }>>>(url);
        const outer = resolveFireflyResponseData(result.data);
        const rawAssets = outer?.data?.tokenAssets ?? [];

        const grouped = new Map<string, SwapToken[]>();
        for (const t of rawAssets) {
            const walletAddr = t.address.toLowerCase();
            const token = normalizeSwapToken({
                address: t.tokenAddress,
                symbol: t.symbol,
                name: t.name,
                decimals: parseInt(t.decimals, 10) || 18,
                chainId: parseInt(t.chainIndex, 10),
                logoURI: t.tokenLogoUrl,
                balance: t.balance,
                price: t.tokenPrice ? parseFloat(t.tokenPrice) : undefined,
                isRiskToken: t.isRiskToken,
            });
            const list = grouped.get(walletAddr);
            if (list) {
                list.push(token);
            } else {
                grouped.set(walletAddr, [token]);
            }
        }

        return grouped;
    }

    // Search token by symbol or address
    // API response is double-wrapped: { code: 0, data: { code: "0", data: [...] } }
    // Inner data uses raw field names (tokenSymbol, tokenName, etc.) same as getAllTokens
    async searchToken(params: SearchTokenParams): Promise<SwapToken[]> {
        const url = urlcat('/swap/wallet/token/search', {
            keyword: params.keyword,
            chain: params.chain,
        });
        const result = await this.get<SwapApiResponse<InnerSwapResponse<RawTokenListItem>>>(url);

        if (!result.ok || result.data.code !== 0) {
            return [];
        }

        const rawTokens = result.data.data?.data;
        if (!Array.isArray(rawTokens)) return [];

        return rawTokens.map((token) =>
            normalizeSwapToken({
                address: token.tokenContractAddress,
                symbol: token.tokenSymbol,
                name: token.tokenName,
                decimals: parseInt(token.decimals, 10) || 18,
                chainId: parseInt(token.chainIndex, 10),
                logoURI: token.tokenLogoUrl,
                price: token.tokenPrice ? parseFloat(token.tokenPrice) : undefined,
                marketCapUsd: token.marketCapUsd,
                priceChange24h: token.tokenPriceChange24h,
            }),
        );
    }

    // Get recent tokens (backend path: v1/swap/recent_token with chains, size, cursor)
    async getRecentTokens(params: RecentTokenParams = {}): Promise<RecentToken[]> {
        const url = urlcat('/v1/swap/recent_token', {
            chains: params.chains,
            size: params.size ?? 20,
            cursor: params.cursor,
        });
        const result = await this.get<SwapApiResponse<RecentTokenResponse>>(url);

        // Gracefully handle 404 or other errors
        if (!result.ok || result.data.code !== 0) {
            return [];
        }

        const data = resolveFireflyResponseData(result.data);
        return data?.list ?? [];
    }

    // Get trending tokens
    async getTrendingTokens(params: { chains?: string; sort?: string; page?: number } = {}): Promise<SwapToken[]> {
        const url = urlcat('/v3/token/trending', {
            page: params.page ?? 1,
            chains: params.chains,
            sort: params.sort ?? 'h6_trending',
        });
        const result = await this.get<SwapApiResponse<RawTrendingToken[]>>(url);

        if (!result.ok || result.data.code !== 0) {
            return [];
        }

        const rawTokens = result.data.data ?? [];

        return rawTokens.map((token) =>
            normalizeSwapToken({
                address: token.token_address ?? '',
                symbol: token.token_symbol ?? '',
                name: token.token_name ?? '',
                decimals: token.token_decimal ?? 18,
                chainId: token.chain_id_num ?? 0,
                logoURI: token.token_icon,
                price: token.token_price ? parseFloat(token.token_price) : undefined,
                marketCapUsd: token.market_cap_usd,
                priceChange24h: token.price_change?.h24,
            }),
        );
    }

    // Batch fetch token details
    // Used to get full token info (including logos) for default tokens
    async getTokenDetailBatch(list: Array<{ chainId: string; address: string }>): Promise<SwapToken[]> {
        const result = await this.post<SwapApiResponse<InnerSwapResponse<RawTokenListItem>>>(
            '/swap/wallet/token/token-detail-batch',
            { list },
        );

        if (!result.ok || result.data.code !== 0) {
            return [];
        }

        const rawTokens = result.data.data?.data ?? [];

        return rawTokens.map((token) =>
            normalizeSwapToken({
                address: token.tokenContractAddress,
                symbol: token.tokenSymbol,
                name: token.tokenName,
                decimals: parseInt(token.decimals, 10) || 18,
                chainId: parseInt(token.chainIndex, 10),
                logoURI: token.tokenLogoUrl,
                price: token.tokenPrice ? parseFloat(token.tokenPrice) : undefined,
            }),
        );
    }

    // Upload swap transaction to backend for tx detail page
    async uploadSwap(params: {
        chain_id: number;
        hash: string;
        is_bridge: boolean;
        is_copy?: boolean;
        is_free_gas?: boolean;
        comment?: string;
    }): Promise<boolean> {
        const result = await this.post<SwapApiResponse<string>>('/v1/swap/upload', {
            chain_id: params.chain_id,
            hash: params.hash,
            is_bridge: params.is_bridge,
            is_copy: params.is_copy ?? false,
            is_free_gas: params.is_free_gas ?? false,
            comment: params.comment ?? '',
        });
        return result.ok && result.data.code === 0;
    }

    // Fetch swap detail by hash (is_realtime=true forces API lookup)
    async getSwapDetail(params: { chain_id: number; hash: string; is_bridge: boolean }): Promise<boolean> {
        const result = await this.post<SwapApiResponse<unknown[]>>('/v1/swap/detail', {
            list: [{ chain_id: params.chain_id, hash: params.hash }],
            is_realtime: true,
            is_bridge: params.is_bridge,
        });
        return result.ok && result.data.code === 0 && !!result.data.data?.length;
    }
}

// Factory function to create swap endpoint with auth
export function createSwapEndpoint(token?: string) {
    return new SwapEndpoint({
        baseURL: env.external.NEXT_PUBLIC_FIREFLY_ROOT_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
}
