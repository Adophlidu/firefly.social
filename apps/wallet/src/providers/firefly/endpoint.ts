import { Locale, type PredictionPlatform, type SocialSource } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import type { Address, Hex } from 'viem';

import { EmailCodeLimitExceededError, InvalidPolymarketAccountError } from '@/constants/error.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { Fetch } from '@/lib/Fetch.js';
import { resolveRelatedProfileParams } from '@/providers/firefly/resolveRelatedProfileParams.js';
import {
    type CancelPolymarketOrderResponse,
    type CreatePolymarketLimitOrderBody,
    type CreatePolymarketLimitOrderResponse,
    type CreatePolymarketMarketOrderBody,
    type CreatePolymarketMarketOrderResponse,
    type DepositAllSupportedTokensResponse,
    type DepositStatusResponse,
    type DepositSupportedTokensResponse,
    ErrorCode,
    type GetMultiChainTokenListResponse,
    type GetPolymarketAccountOpenOrdersResponse,
    type GetPolymarketHistoryResponse,
    type GetPolymarketToWinAmountResponse,
    type GetPolymarketV2PositionsResponse,
    type PlatformIdentityKey,
    type PolymarketAccount,
    type PolymarketActivityResponse,
    type PolymarketBatchClaimV2Body,
    type PolymarketClaimV2Response,
    type PolymarketDepositAddressesResponse,
    type PolymarketEvent,
    type PolymarketOrderBookData,
    type PolymarketProfileBalance,
    type PolymarketProfileListResponse,
    type PolymarketProfilePnLResponse,
    type PolymarketProfileResponse,
    type PolymarketUpgradeResponse,
    type PolymarketUpgradeTaskResponse,
    type PolymarketV2PositionSortBy,
    type PolymarketV2PositionSortDirection,
    type PolymarketWithdrawResponse,
    type PreviewPolymarketWithdrawResponse,
    type Response,
    type SearchProfileResponse,
    type SearchTokenResponse,
    type TokenAsset,
    type WalletHistoryTransactionsResponse,
    type WalletProfileInfoListResponse,
    type WalletProfileResponse,
    type WalletProfiles,
    type WithdrawSupportedTokensResponse,
} from '@/providers/types/Firefly.js';
import type { FreeGasRequestBody, FreeGasResponse } from '@/providers/types/FreeGas.js';

function resolvePolymarketLocale(locale?: Locale, rewrites?: Partial<Record<Locale, string>>) {
    if (!locale) return;
    if (rewrites?.[locale]) {
        return rewrites[locale];
    }

    switch (locale) {
        case Locale.zhHans:
            return 'zh';
        case Locale.zhHant:
            return 'zh-Hant';
        case Locale.en:
            return;
        case Locale.es:
            return 'es';
        case Locale.ja:
            return 'ja';
        case Locale.ko:
            return 'ko';
        default:
            safeUnreachable(locale);
            return;
    }
}

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

    async getPolymarketAccount() {
        const result = await this.get<PolymarketAccount>(`/polymarket/v1/polymarket/getAccount`);
        if (result.status === 400 || result.data?.code === ErrorCode.InvalidPolymarketAccount) {
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

    async getProfile(address: Address, isPolymarketProxy?: boolean) {
        const result = await this.post<PolymarketProfileResponse>(`/v1/polymarket/profile/info`, {
            wallet: address,
            is_polymarketProxy: isPolymarketProxy,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getWalletProfileInfoList(address: Address, platform: PredictionPlatform, isPolymarketProxy?: boolean) {
        const result = await this.post<WalletProfileInfoListResponse>(`/v2/wallet/profileinfo/list`, {
            walletAddress: [address],
            is_polymarketProxy: isPolymarketProxy,
            // Note: API has a typo - "betsPlatorm" instead of "betsPlatform"
            betsPlatorm: platform,
        });
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
    ): Promise<{ hash: Hex; isDepositAddress: boolean }> {
        const result = await this.post<PolymarketWithdrawResponse>(`/polymarket/v2/polymarket/withdraw`, {
            amount,
            token_address: tokenAddress,
            chain_id: chainId,
            original_message: originalMessage,
            signature_message: signatureMessage,
        });
        const resolvedData = resolveFireflyResponseData(result.data);
        if (resolvedData.status !== 'success' || !resolvedData.hash) {
            throw new Error(resolvedData.error_message || 'Failed to initiate withdraw');
        }

        return { hash: resolvedData.hash, isDepositAddress: resolvedData.is_deposit_address };
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

    async getPolymarketWithdrawSupportedTokens() {
        const result = await this.get<WithdrawSupportedTokensResponse>(
            '/polymarket/v1/polymarket/withdraw/supported_tokens',
        );
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketV2CurrentPositions(
        wallet: Address,
        options?: {
            redeemable?: boolean;
            offset?: number;
            limit?: number;
            eventId?: string;
            locale?: Locale;
            sortBy?: PolymarketV2PositionSortBy;
            sortDirection?: PolymarketV2PositionSortDirection;
        },
    ) {
        const url = urlcat('/v2/polymarket/current/positions', {
            user: wallet,
            redeemable: options?.redeemable ?? false,
            offset: options?.offset ?? 0,
            limit: options?.limit ?? 20,
            locale: resolvePolymarketLocale(options?.locale),
            ...(options?.eventId ? { eventId: options.eventId } : {}),
            ...(options?.sortBy ? { sortBy: options.sortBy } : {}),
            ...(options?.sortDirection ? { sortDirection: options.sortDirection } : {}),
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
            locale?: Locale;
            sortBy?: PolymarketV2PositionSortBy;
            sortDirection?: PolymarketV2PositionSortDirection;
        },
    ) {
        const url = urlcat('/v2/polymarket/closed/positions', {
            user: wallet,
            offset: options?.offset ?? 0,
            limit: options?.limit ?? 20,
            locale: resolvePolymarketLocale(options?.locale),
            ...(options?.eventId ? { eventId: options.eventId } : {}),
            ...(options?.sortBy ? { sortBy: options.sortBy } : {}),
            ...(options?.sortDirection ? { sortDirection: options.sortDirection } : {}),
        });
        const result = await this.get<GetPolymarketV2PositionsResponse>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketOpenOrdersList(options?: { cursor?: string; locale?: Locale }) {
        const result = await this.post<GetPolymarketAccountOpenOrdersResponse>(
            '/polymarket/v1/polymarket/getOpensOrdersList',
            {
                cursor: options?.cursor || null,
                ...(options?.locale ? { locale: resolvePolymarketLocale(options.locale) } : {}),
            },
        );
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

    async getPolymarketUserActivity(options: {
        proxyWallet: string;
        limit?: number;
        cursor?: string;
        locale?: Locale;
    }) {
        const url = urlcat('/v2/polymarket/user/activity', {
            proxy_wallet: options.proxyWallet,
            limit: options.limit,
            cursor: options.cursor,
            locale: resolvePolymarketLocale(options.locale),
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

    async polymarketBatchClaimV2(body: PolymarketBatchClaimV2Body) {
        const result = await this.post<PolymarketClaimV2Response>('/polymarket/v2/polymarket/claim', body);
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

    async getPolymarketWithdrawStatus(hash: string, isBridge: boolean, isDepositAddress: boolean) {
        const url = urlcat('/polymarket/v1/polymarket/withdraw/status', {
            hash,
            is_bridge: isBridge ? 1 : 0,
            is_deposit_address: isDepositAddress ? 1 : 0,
        });
        const result = await this.get<
            Response<{
                hash: string;
                status: 'pending' | 'success' | 'fail';
            }>
        >(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketEventBySlug(slug: string, locale?: Locale) {
        const url = urlcat('/v1/polymarket/event/detail', {
            slug,
            locale: resolvePolymarketLocale(locale, {
                [Locale.zhHant]: 'zh-hant',
            }),
        });
        const result = await this.get<Response<PolymarketEvent>>(url);
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketBalance(address: string, isProxyAddress?: boolean) {
        const url = urlcat('/v1/polymarket/wallet/balance', { address, proxy: isProxyAddress });
        const result = await this.get<Response<PolymarketProfileBalance>>(url);
        return resolveFireflyResponseData(result.data);
    }

    // #region Pin code workflow related endpoints
    async sendCodeToEmail(email: string) {
        const result = await this.post<Response<void>>('/v3/auth/email/generateOTP', {
            email,
        });
        if (result.status === 400) {
            throw new EmailCodeLimitExceededError();
        }

        return resolveFireflyResponseData(result.data);
    }

    async addPinCode(codeHash: string, email: string, emailCode: string) {
        const result = await this.post<Response<void>>('/v1/privy-code/add-privy-code', {
            privy_code_hash: codeHash,
            email,
            email_verify_code: emailCode,
        });
        return resolveFireflyResponseData(result.data);
    }

    async updatePinCode(codeHash: string, emailCode: string) {
        const result = await this.post<Response<void>>('/v1/privy-code/update-privy-code', {
            new_privy_code_hash: codeHash,
            email_verify_code: emailCode,
        });
        return resolveFireflyResponseData(result.data);
    }

    async updatePinCodeEmail(codeHash: string, email: string, emailCode: string) {
        const result = await this.post<Response<void>>('/v1/privy-code/update-privy-email', {
            privy_code_hash: codeHash,
            new_email: email,
            email_verify_code: emailCode,
        });
        return resolveFireflyResponseData(result.data);
    }

    async verifyPinCode(codeHash: string) {
        const result = await this.post<Response<void>>('/v1/privy-code/verify-privy-code', {
            privy_code_hash: codeHash,
        });
        return resolveFireflyResponseData(result.data);
    }

    async getPinCodeStatus() {
        const result = await this.post<
            Response<{
                email: string;
                is_set_pin_code: boolean;
                enable: boolean;
            }>
        >('/v1/privy-code/status');
        return resolveFireflyResponseData(result.data);
    }

    async updatePinCodeEnableStatus(codeHash: string, enabled: boolean) {
        const result = await this.post<Response<void>>('/v1/privy-code/update-enable', {
            privy_code_hash: codeHash,
            value: enabled,
        });
        return resolveFireflyResponseData(result.data);
    }
    // #endregion

    // #region Tron deposit
    async getPolymarketDepositAddress() {
        const result = await this.post<PolymarketDepositAddressesResponse>('/polymarket/v1/polymarket/deposit/address');
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketDepositSupportedTokens() {
        const result = await this.get<DepositSupportedTokensResponse>(
            '/polymarket/v1/polymarket/deposit/supported_tokens',
        );
        return resolveFireflyResponseData(result.data);
    }

    /** Deposit supported assets grouped by chain (evm / svm / tron). */
    async getPolymarketDepositAllSupportedTokens() {
        const result = await this.get<DepositAllSupportedTokensResponse>(
            '/polymarket/v1/polymarket/deposit/supported_tokens/all',
        );
        return resolveFireflyResponseData(result.data);
    }

    async getPolymarketDepositStatus(address: string) {
        const result = await this.get<DepositStatusResponse>(
            urlcat('/polymarket/v1/polymarket/deposit/status', { address }),
        );
        return resolveFireflyResponseData(result.data);
    }
    // #endregion

    /** Creates a Shortlink for an allowlisted HTTPS destination. Requires a logged-in session. */
    async createShortlink(url: string): Promise<{ code: string; shortlink: string }> {
        const result = await this.post<Response<{ code: string; shortlink: string }>>('/v1/shortlinks', { url });
        return resolveFireflyResponseData(result.data);
    }
}
