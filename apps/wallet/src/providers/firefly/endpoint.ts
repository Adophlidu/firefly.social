import urlcat from 'urlcat';
import type { Address, Hex } from 'viem';

import type { SocialSource } from '@/constants/enum.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { Fetch } from '@/lib/Fetch.js';
import { resolveRelatedProfileParams } from '@/providers/firefly/resolveRelatedProfileParams.js';
import {
    type CancelPolymarketOrderResponse,
    type CollectionsResponse,
    type CreatePolymarketLimitOrderBody,
    type CreatePolymarketLimitOrderResponse,
    type CreatePolymarketMarketOrderBody,
    type CreatePolymarketMarketOrderResponse,
    ErrorCode,
    type GetCollectionResponse,
    type GetMultiChainTokenListResponse,
    type GetPolymarketAccountOpenOrdersResponse,
    type GetPolymarketCurrentPositionsResponse,
    type GetPolymarketHistoryResponse,
    type GetPolymarketPositionInfoResponse,
    type GetPolymarketTokenIdBetSharesResponse,
    type GetPolymarketToWinAmountResponse,
    type GetPolymarketV2PositionsResponse,
    type NFTDetailsResponse,
    type PlatformIdentityKey,
    type PoapResponse,
    type PolymarketAccount,
    type PolymarketActivityResponse,
    type PolymarketBatchClaimV2Body,
    type PolymarketClaimV1Response,
    type PolymarketClaimV2Response,
    type PolymarketOrderBookData,
    type PolymarketProfileListResponse,
    type PolymarketProfilePnLResponse,
    type PolymarketSingleClaimV1Body,
    type PolymarketUpgradeResponse,
    type PolymarketUpgradeTaskResponse,
    type PolymarketWithdrawResponse,
    type PreviewPolymarketWithdrawResponse,
    type Response,
    type SearchProfileResponse,
    type SearchTokenResponse,
    type TokenAsset,
    type WalletHistoryTransactionsResponse,
    type WalletProfileResponse,
    type WalletProfiles,
} from '@/providers/types/Firefly.js';
import type { FreeGasRequestBody, FreeGasResponse } from '@/providers/types/FreeGas.js';

export class FireflyEndpoint extends Fetch {
    async getMultiChainTokenList(addresses: string[], chains: number[]) {
        const result = await this.get<GetMultiChainTokenListResponse>(
            urlcat('/swap/wallet/asset/muti-chain', {
                chains: chains.join(','),
                addresses: addresses.join(','),
            }),
        );
        return resolveFireflyResponseData(result.data).data;
    }

    async getTokenByAddress(walletAddress: string, chainId: number, tokenAddress: string) {
        const result = await this.get<Response<Omit<TokenAsset, 'tokenLogoUrl'> | null>>(
            urlcat('/swap/wallet/asset/token', {
                address: walletAddress,
                chainId,
                tokenAddress,
            }),
        );
        return resolveFireflyResponseData(result.data);
    }

    async getWalletHistoryTransactions(
        chains: number[],
        address: string,
        options?: {
            cursor?: string;
        },
    ) {
        const url = urlcat('/v1/wallet_history/transactions', {
            chains: chains.join(','),
            address,
            cursor: options?.cursor,
        });
        const result = await this.get<WalletHistoryTransactionsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPOAPs(wallet: string) {
        const url = urlcat('/v1/nft/wallet/poap', {
            walletAddress: wallet,
        });
        const result = await this.get<PoapResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getUserCollections(
        chainId: number,
        walletAddress: string,
        options?: {
            cursor?: string;
        },
    ) {
        const url = urlcat('/v1/nft/wallet/own/collection', {
            chainId,
            walletAddress,
            cursor: options?.cursor,
        });
        const result = await this.get<CollectionsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getUserCollectionNFTs(
        walletAddress: string,
        chainId: number,
        contractAddress: string,
        options?: {
            cursor?: string;
        },
    ) {
        const url = urlcat('/v1/nft/wallet/own', {
            walletAddress,
            chainId,
            contractAddress,
            cursor: options?.cursor,
        });
        const result = await this.get<NFTDetailsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async searchIdentity(
        keyword: string,
        {
            platforms,
            size = 100,
            cursor,
            signal,
        }: {
            platforms?: SocialSource[];
            size?: number;
            cursor?: string;
            signal?: AbortSignal;
        } = {},
    ) {
        const url = urlcat('/v2/search/identity', {
            keyword,
            size,
            cursor,
        });
        const platform = platforms?.map((x) => resolveSourceInUrlForApi(x)).join(','); // There are commas here, without escaping
        const result = await this.get<SearchProfileResponse>(platform ? `${url}&platform=${platform}` : url, {
            signal,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getWalletProfileInfo(options: Partial<Record<PlatformIdentityKey, string>>) {
        const params = await resolveRelatedProfileParams(options);
        const url = urlcat('/v2/wallet/profileinfo', params);
        const result = await this.get<WalletProfileResponse>(url, {
            method: 'GET',
            cache: 'no-store',
        });
        return (
            resolveFireflyResponseData(result.data) ||
            ({
                walletProfiles: [],
                lensProfilesV3: [],
                farcasterProfiles: [],
                twitterProfiles: [],
                solanaWalletProfiles: [],
                bskyProfiles: [],
            } satisfies WalletProfiles)
        );
    }

    async searchTokens(query: string) {
        const url = urlcat('/v1/token/search_data', {
            query,
        });
        const result = await this.get<SearchTokenResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getCollection(chainId: number, contractAddress: string) {
        const url = urlcat('/v1/nft/collection', {
            chainId,
            contractAddress,
        });
        const result = await this.get<GetCollectionResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketAccount() {
        const result = await this.get<PolymarketAccount>(`/polymarket/v1/polymarket/getAccount`);
        if (result.data.code === ErrorCode.InvalidPolymarketAccount) {
            throw new InvalidPolymarketAccountError();
        }
        return resolveFireflyResponseData(result.data);
    }

    async createPolymarketAccount() {
        const result = await this.post<PolymarketAccount>(`/polymarket/v1/polymarket/createAccount`);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketProfilePnl(address: Address) {
        const url = urlcat('/v1/polymarket/activity/pnl/profile', { proxy_address: address });
        const result = await this.get<PolymarketProfilePnLResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketProfileList(wallet: Address[], isPolymarketProxy: boolean) {
        const result = await this.post<PolymarketProfileListResponse>(`/v1/polymarket/profile/list`, {
            wallet,
            is_polymarketProxy: isPolymarketProxy,
        });
        return resolveFireflyResponseData(result.data);
    }

    async polymarketWithdraw(
        amount: string,
        tokenAddress: string,
        chainId: number,
        originalMessage: string,
        signatureMessage: string,
    ): Promise<Hex> {
        const result = await this.post<PolymarketWithdrawResponse>(`/polymarket/v2/polymarket/withdraw`, {
            amount,
            token_address: tokenAddress,
            chain_id: chainId,
            original_message: originalMessage,
            signature_message: signatureMessage,
        });
        const resolvedData = resolveFireflyResponseData(result.data);
        if (resolvedData.status !== 'success' || !resolvedData.hash) {
            throw new Error('Failed to initiate withdraw');
        }

        return resolvedData.hash;
    }

    async getPolymarketWithdrawAmount(amount: string, tokenAddress: string, chainId: number) {
        const result = await this.get<PreviewPolymarketWithdrawResponse>(
            urlcat(`/polymarket/v2/polymarket/withdraw_amount`, {
                amount,
                token_address: tokenAddress,
                chain_id: chainId,
            }),
        );
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketPositionsInfo(
        wallet: Address,
        options?: {
            excludeWin?: boolean;
            limit?: number;
            cursor?: number;
            isPolymarketProxy?: boolean;
            isClaim?: boolean;
            conditionId?: string;
            eventId?: string;
        },
    ) {
        const result = await this.post<GetPolymarketPositionInfoResponse>(`/v1/polymarket/positions/info`, {
            wallet,
            exclude_win: options?.excludeWin,
            limit: options?.limit,
            cursor: options?.cursor,
            is_polymarketProxy: options?.isPolymarketProxy,
            is_claim: options?.isClaim,
            conditionId: options?.conditionId,
            eventId: options?.eventId,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketCurrentPositions(wallet: Address, isPolymarketProxy: boolean) {
        const result = await this.post<GetPolymarketCurrentPositionsResponse>(`/v1/polymarket/current/positions`, {
            wallet,
            is_polymarketProxy: isPolymarketProxy,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketV2CurrentPositions(
        wallet: Address,
        options?: {
            redeemable?: boolean;
            offset?: number;
            limit?: number;
            eventId?: string;
        },
    ) {
        const url = urlcat('/v2/polymarket/current/positions', {
            user: wallet,
            redeemable: options?.redeemable ?? false,
            offset: options?.offset ?? 0,
            limit: options?.limit ?? 20,
            ...(options?.eventId ? { eventId: options.eventId } : {}),
        });
        const result = await this.get<GetPolymarketV2PositionsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketV2ClosedPositions(
        wallet: Address,
        options?: {
            offset?: number;
            limit?: number;
            eventId?: string;
        },
    ) {
        const url = urlcat('/v2/polymarket/closed/positions', {
            user: wallet,
            offset: options?.offset ?? 0,
            limit: options?.limit ?? 20,
            ...(options?.eventId ? { eventId: options.eventId } : {}),
        });
        const result = await this.get<GetPolymarketV2PositionsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketSettlablePositions(
        wallet: Address,
        options?: {
            isPolymarketProxy?: boolean;
            limit?: number;
            excludeWin?: boolean;
            excludeLose?: boolean;
        },
    ) {
        const result = await this.post<GetPolymarketPositionInfoResponse>('/v1/graphsql/history/position', {
            wallet: [wallet],
            is_polymarketProxy: options?.isPolymarketProxy ?? true,
            limit: options?.limit ?? 50,
            cursor: 0,
            is_claim: true,
            exclude_win: options?.excludeWin ?? false,
            exclude_lose: options?.excludeLose ?? false,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketOpenOrdersList(options?: { cursor?: string }) {
        const url = urlcat('/polymarket/v1/polymarket/getOpensOrdersList', {
            cursor: options?.cursor || '0',
        });
        const result = await this.post<GetPolymarketAccountOpenOrdersResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketBetsTimeline(
        walletAddresses: Address[],
        options?: {
            cursor?: string;
            size?: number;
        },
    ) {
        const result = await this.post<GetPolymarketHistoryResponse>('/v1/user/timeline/bets', {
            walletAddresses,
            platform: 'polymarket',
            cursor: options?.cursor || '0',
            size: options?.size || 20,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketUserActivity(options: { proxyWallet: string; limit?: number; cursor?: string }) {
        const url = urlcat('/v1/polymarket/user/activity', {
            proxy_wallet: options.proxyWallet,
            limit: options.limit,
            cursor: options.cursor,
        });
        const result = await this.get<PolymarketActivityResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async createPolymarketLimitOrder(body: CreatePolymarketLimitOrderBody) {
        const result = await this.post<CreatePolymarketLimitOrderResponse>(
            '/polymarket/v1/polymarket/createLimitOrder',
            body,
        );
        return resolveFireflyResponseData(result.data);
    }

    async createPolymarketMarketOrder(body: CreatePolymarketMarketOrderBody) {
        const result = await this.post<CreatePolymarketMarketOrderResponse>(
            '/polymarket/v1/polymarket/createMarketOrder',
            body,
        );
        return resolveFireflyResponseData(result.data);
    }

    async polymarketClaimV1(body: PolymarketSingleClaimV1Body) {
        const result = await this.post<PolymarketClaimV1Response>('/polymarket/v1/polymarket/claim', body);
        return resolveFireflyResponseData(result.data);
    }

    async polymarketBatchClaimV2(body: PolymarketBatchClaimV2Body) {
        const result = await this.post<PolymarketClaimV2Response>('/polymarket/v2/polymarket/claim', body);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketTokenIdBetShares(tokenId: string) {
        const result = await this.post<GetPolymarketTokenIdBetSharesResponse>(
            '/polymarket/v1/polymarket/getTokenIdBetShares',
            { tokenId },
        );
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketToWinAmount(
        tokenId: string,
        side: 'BUY' | 'SELL',
        amount: number | string,
        isLimit: boolean,
        price?: number,
    ) {
        const result = await this.get<GetPolymarketToWinAmountResponse>(
            urlcat('/polymarket/v1/polymarket/towin_amount', {
                token_id: tokenId,
                side,
                amount,
                is_limit: isLimit,
                price,
            }),
        );
        return resolveFireflyResponseData(result.data);
    }

    async cancelPolymarketOrder(orderId: string) {
        const result = await this.post<CancelPolymarketOrderResponse>('/polymarket/v1/polymarket/cancelOrder', {
            orderId,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketSetting() {
        const result = await this.get<Response<{ export_privatekey: boolean }>>('/polymarket/v1/polymarket/setting');
        return resolveFireflyResponseData(result.data);
    }

    async exportPolymarketPrivateKey(original_message: string, signature_message: string) {
        const url = '/polymarket/v1/polymarket/export_privatekey';
        const result = await this.post<Response<{ privatekey: string }>>(url, {
            original_message,
            signature_message,
        });
        if (result.ok) {
            return result.data.data?.privatekey;
        }
        return null;
    }

    /**
     * Upload withdraw record to server.
     * @param proxy - Polymarket proxy address
     * @param receiver - Receiver wallet address
     * @param amount - USDC amount in raw units (e.g. "10500000" for 10.5 USDC)
     * @param hash - Transaction hash
     */
    async polymarketWithdrawUpload(proxy: string, receiver: string, amount: string, hash: string) {
        const result = await this.post<Response<void>>('/polymarket/v2/polymarket/withdraw/upload', {
            proxy,
            receiver,
            amount,
            hash,
        });
        return resolveFireflyResponseData(result.data);
    }

    /**
     * Upload deposit record to server.
     * @param proxy - Polymarket proxy address
     * @param sender - Sender wallet address
     * @param amount - USDC amount in raw units (e.g. "10500000" for 10.5 USDC)
     * @param hash - Transaction hash
     */
    async polymarketDepositUpload(proxy: string, sender: string, amount: string, hash: string) {
        const result = await this.post<Response<void>>('/polymarket/v1/polymarket/deposit/upload', {
            proxy,
            sender,
            amount,
            hash,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketUpgradeTask(proxyAddress: string) {
        const result = await this.get<PolymarketUpgradeTaskResponse>(
            urlcat('/polymarket/v1/polymarket/upgrade/task', { proxy_address: proxyAddress }),
        );
        return resolveFireflyResponseData(result.data);
    }

    async polymarketV2Upgrade(proxyAddress: string) {
        await this.polymarketV2Approve(proxyAddress);
        return this.polymarketV2Wrap(proxyAddress);
    }

    async polymarketV2Approve(proxyAddress: string) {
        const result = await this.post<PolymarketUpgradeResponse>('/polymarket/v1/polymarket/approve', {
            proxy_address: proxyAddress,
        });
        return resolveFireflyResponseData(result.data);
    }

    async polymarketV2Wrap(proxyAddress: string) {
        const result = await this.post<PolymarketUpgradeResponse>('/polymarket/v1/polymarket/wrap', {
            proxy_address: proxyAddress,
        });
        return resolveFireflyResponseData(result.data);
    }

    async submitFreeGasTransaction(body: FreeGasRequestBody) {
        const result = await this.post<Response<FreeGasResponse>>('/v1/privy/tx/free-gas', body);
        return resolveFireflyResponseData(result.data);
    }

    async checkFreeGasEligibility(body: { chainId: number; txType: string; tx: { to: string } }) {
        const result = await this.post<Response<boolean>>('/v1/privy/tx/free-gas/check', body);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketOrderBooks(tokenIds: string[], signal?: AbortSignal) {
        const result = await this.post<Response<PolymarketOrderBookData[] | null>>(
            '/polymarket/v1/polymarket/books',
            {
                token_ids: tokenIds,
            },
            { signal },
        );
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketWithdrawStatus(hash: string, isBridge: boolean) {
        const url = urlcat('/polymarket/v1/polymarket/withdraw/status', {
            hash,
            is_bridge: isBridge ? 1 : 0,
        });
        const result = await this.get<
            Response<{
                hash: string;
                status: 'pending' | 'success' | 'fail';
            }>
        >(url);
        return resolveFireflyResponseData(result.data);
    }
}
