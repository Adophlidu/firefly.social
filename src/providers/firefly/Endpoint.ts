import { compact, first, sortBy } from 'lodash-es';
import urlcat from 'urlcat';
import { type Address, type Hex } from 'viem';

import { queryClient } from '@/configs/queryClient.js';
import {
    ConnectionPlatform,
    ExploreSwitchType,
    FireflyPlatform,
    Locale,
    NetworkType,
    type ProfilePageSource,
    type SocialSource,
    Source,
    SourceInURL,
    TipsNotificationType,
    TxReactionType,
} from '@/constants/enum.js';
import { NotFoundError, OTPExceededMaximumLimit } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { SetQueryDataForAddWallet } from '@/decorators/SetQueryDataForAddWallet.js';
import { SetQueryDataForBlockWallet } from '@/decorators/SetQueryDataForBlockWallet.js';
import {
    SetQueryDataForDeleteWallet,
    SetQueryDataForReportAndDeleteWallet,
} from '@/decorators/SetQueryDataForDeleteWallet.js';
import { SetQueryDataForWatchWallet } from '@/decorators/SetQueryDataForWatchWallet.js';
import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import { formatPostsFromTruthSocial } from '@/helpers/formatPostsFromTruthSocial.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { extractIpfsCID } from '@/helpers/isIpfsCID.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { isZero } from '@/helpers/number.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveDebankChain } from '@/helpers/resolveDebankChain.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { getBskyProfileById } from '@/providers/bsky/getBskyProfileById.js';
import { getPublicKeyInHexFromPrivateKey } from '@/providers/farcaster/ed25519.js';
import { formatFarcasterPostFromFirefly } from '@/providers/farcaster/formatFarcasterPostFromFirefly.js';
import { formatFarcasterProfileFromSuggestedFollow } from '@/providers/farcaster/formatFarcasterProfileFromSuggestedFollow.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getWalletProfileByAddressOrEns } from '@/providers/firefly/endpoints/getWalletProfileByAddressOrEns.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { formatLensProfileFromSuggestedFollow } from '@/providers/lens/formatLensProfileFromSuggestedFollow.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import type { Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import {
    type BindWalletResponse,
    type BlockedUsersResponse,
    type BlockFields,
    type BlockUserResponse,
    type CastResponse,
    type CollectArticleResponse,
    type CollectionItemsResponse,
    type CollectionResponse,
    type CollectionsResponse,
    type CollectionStatisticsResponse,
    type CreateAnonymousPostOptions,
    type CreateAnonymousPostResponse,
    type DebankTokensResponse,
    type DesktopLinkInfoResponse,
    type DesktopLinkInfoStatusResponse,
    type DetectAddressResponse,
    type DexCoinDetailResponse,
    type EmptyResponse,
    type FireflyIdentity,
    type FireflyProfileUpdateParams,
    type FireflyWalletConnection,
    type FollowingTraderCountResponse,
    type GenerateFarcasterSignatureResponse,
    type GenerateOTPResponse,
    type GenesisSparksAccountsResponse,
    type GetAllConnectionsResponse,
    type GetAnonymousPostResponse,
    type GetCollectStatusResponse,
    type GetExploreSwitchConfigResponse,
    type GetFarcasterSuggestedFollowUserResponse,
    type GetFollowingCountByNFTParams,
    type GetFollowingCountByNFTResponse,
    type GetLensSuggestedFollowUserResponse,
    type GetMultiChainTokenListResponse,
    type GetSponsorMintStatusResponse,
    type GetTokenOptions,
    type HexResponse,
    type HoldersResponse,
    type IsMutedAllResponse,
    type LinkDigestResponse,
    type LoginFarcasterWithWalletResponse,
    type LoginResponse,
    type MetricsDownloadMetaInfoResponse,
    type MetricsDownloadResponse,
    type MetricsItemToUpload,
    type MetricsStatusResponse,
    type MintBySponsorResponse,
    type MuteAllResponse,
    type NFTDetailsResponse,
    type NFTMintingResponse,
    type PolymarketActivityTimeline,
    type PolymarketPositionData,
    type PolymarketProfileData,
    type PolymarketTradeData,
    type PostByAnonymousRateLimitsResponse,
    type PrivyWalletResponse,
    type ProjectResponse,
    type Response,
    type RootdataPeopleResponse,
    type SearchNFTResponse,
    type SearchProfileResponse,
    type SearchTokenInfosResponse,
    type SearchTokenResponse,
    type SparksAccountResponse,
    type SponsorMintOptions,
    type SwapActivityDetail,
    type SwapActivityTimeline,
    type TakoExternalHostedData,
    type TelegramLoginBotResponse,
    type TipsDetailResponse,
    type TokenAsset,
    type TokenPriceStatsOptions,
    type TokenPriceStatsResponse,
    type TokenWithMarketData,
    type TrendingNFTsResponse,
    type TrumpTruthSocialPostsResponse,
    type TruthSocialPostResponse,
    type WalletHistoryTransactionsResponse,
    type WalletProfile,
    type WalletRelationResponse,
    type WalletsFollowStatusResponse,
    WatchType,
} from '@/providers/types/Firefly.js';
import type {
    DiscoverNFTResponseV3,
    NFTDetailResponse,
    NFTFeedV3,
    PoapDetailResponse,
    PoapHoldersResponse,
    PoapResponse,
} from '@/providers/types/NFTs.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { encryptPasscode } from '@/services/crypto.js';
import { getBlockRelation } from '@/services/getBlockRelation.js';
import { settings } from '@/settings/index.js';

async function block(field: BlockFields, profileId: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/mute');
    const response = await fireflySessionHolder.fetch<BlockUserResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            [field]: profileId,
        }),
    });
    if (response) return true;
    throw new Error('Failed to block user');
}

async function unblock(field: BlockFields, profileId: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/unmute');
    const response = await fireflySessionHolder.fetch<BlockUserResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            [field]: profileId,
        }),
    });
    if (response) return true;
    throw new Error('Failed to mute user');
}

function fixCollection(collection: EVM.Collection): EVM.Collection {
    return {
        ...collection,
        chain_id: +collection.chain_id,
    };
}

@SetQueryDataForBlockWallet()
@SetQueryDataForAddWallet()
@SetQueryDataForDeleteWallet()
@SetQueryDataForReportAndDeleteWallet()
@SetQueryDataForWatchWallet()
class FireflyEndpoint {
    /**
     * Reports a scam NFT to NFTScan
     */
    async reportNFT(chainId: number, address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/reportNFT', {
            chainId,
            contractAddress: address,
        });
        await fireflySessionHolder.fetchWithSession(url);
    }

    async reportArticle(article: Article) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/create');
        return fireflySessionHolder.fetch<string>(url, {
            method: 'POST',
            body: JSON.stringify({
                platform: FireflyPlatform.Article,
                platform_id: article.author.id,
                post_type: 'text',
                post_id: article.id,
            }),
        });
    }

    async reportFarcasterSigner(session: FarcasterSession, signal?: AbortSignal) {
        // ensure session is available
        fireflySessionHolder.assertSession('[reportFarcasterSigner] firefly session required');

        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/upSignerConfig');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: session.profileId,
                signerPublickey: await getPublicKeyInHexFromPrivateKey(session.token),
                signerPrivatekey: session.token,
            }),
            signal,
        });
    }

    async getAllTokenList(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/misc/all_token_list', {
            address,
        });
        const result = await fireflySessionHolder.fetch<DebankTokensResponse>(url);
        return result.data?.list || [];
    }

    async getTokensByAddress(address: string): Promise<
        Array<
            DebankToken & {
                chainId?: number;
                chainLogoUrl?: string;
            }
        >
    > {
        const tokens = await queryClient.fetchQuery({
            queryKey: ['debank', 'tokens', address],
            queryFn: () => this.getAllTokenList(address),
            staleTime: 1000 * 60 * 1,
        });

        return tokens.map((token) => {
            const chain = resolveDebankChain(token.chain);
            return {
                ...token,
                chainId: chain?.community_id,
                chainLogoUrl: chain?.logo_url,
            };
        });
    }

    async getLensSuggestFollows(indicator?: PageIndicator) {
        const response = await fireflySessionHolder.fetch<GetLensSuggestedFollowUserResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, `/v1/lens/suggested_follow_list`, {
                cursor: indicator?.id,
            }),
        );
        if (!response.data) return createPageable(EMPTY_LIST, indicator);
        const profiles = compact(response.data.suggestedFollowList.map((x) => x[0])).map((user) =>
            formatLensProfileFromSuggestedFollow(user),
        );
        return createPageable(profiles, indicator, createIndicator(indicator, `${response.data.cursor}`));
    }

    async getFarcasterSuggestFollows(indicator?: PageIndicator) {
        return farcasterSessionHolder.withSession(async (session) => {
            const response = await fireflySessionHolder.fetch<GetFarcasterSuggestedFollowUserResponse>(
                urlcat(settings.FIREFLY_ROOT_URL, `/v2/farcaster-hub/suggested_follow_list`, {
                    cursor: indicator?.id,
                    sourceFid: session?.profileId,
                }),
            );
            if (!response.data) return createPageable(EMPTY_LIST, indicator);
            const profiles =
                response.data?.suggestedFollowList.map((user) => formatFarcasterProfileFromSuggestedFollow(user)) ?? [];
            return createPageable(profiles, indicator, createIndicator(indicator, `${response.data.cursor}`));
        });
    }

    async verifyAndBindWallet(signMessage: string, signature: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/verify');
        const response = await fireflySessionHolder.fetch<BindWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                signMessage,
                signature,
            }),
        });

        const data = resolveFireflyResponseData(response);
        return data;
    }

    async getMessageToSignMessageForBindSolanaWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/solana/signMessage', {
            address,
        });

        const response = await fireflySessionHolder.fetch<HexResponse>(url, {
            method: 'GET',
        });

        const data = resolveFireflyResponseData(response);
        if (!data) throw new Error('Failed to get message to sign');

        return data;
    }

    async verifyAndBindSolanaWallet(address: string, messageToSign: string, signature: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/solana/solana/verify');
        const response = await fireflySessionHolder.fetch<BindWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                address,
                messageToSign,
                signature,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async watchWallet(address: string) {
        if (!isValidAddressEthereum(address) && !isValidAddressSolana(address))
            throw new Error(`Invalid address: ${address}`);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow', {
            type: isValidAddressSolana(address) ? WatchType.SolanaWallet : WatchType.Wallet,
            toObjectId: address,
        });
        await fireflySessionHolder.fetch<Response<void>>(url, { method: 'PUT' });
        return true;
    }

    async unwatchWallet(address: string) {
        if (!isValidAddressEthereum(address) && !isValidAddressSolana(address))
            throw new Error(`Invalid address: ${address}`);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow', {
            type: isValidAddressSolana(address) ? WatchType.SolanaWallet : WatchType.Wallet,
            toObjectId: address,
        });
        await fireflySessionHolder.fetch<Response<void>>(url, { method: 'DELETE' });
        return true;
    }

    async reportProfile(profileId: string): Promise<boolean> {
        // TODO Mocking result for now.
        return true;
    }

    async searchIdentity(
        keyword: string,
        {
            platforms,
            size = 100,
            indicator,
        }: {
            platforms?: SocialSource[];
            size?: number;
            indicator?: PageIndicator;
        } = {},
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
            keyword,
            size,
            cursor: indicator?.id,
        });
        const platform = platforms?.map((x) => resolveSourceInUrlForApi(x)).join(','); // There are commas here, without escaping
        const response = await fireflySessionHolder.fetch<SearchProfileResponse>(
            platform ? `${url}&platform=${platform}` : url,
            {
                method: 'GET',
            },
        );
        const data = resolveFireflyResponseData(response);
        return createPageable(
            data.list || [],
            indicator,
            data.cursor && data.list?.length ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async discoverNFTs({
        indicator,
        limit = 20,
        chainId,
    }: {
        indicator?: PageIndicator;
        limit?: number;
        chainId?: number;
    } = {}) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/nft/v3', {
            size: limit,
            chainId,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<DiscoverNFTResponseV3>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const feeds = data.result.map<NFTFeedV3>((feed) => ({
            ...feed,
            bookmarked: feed.has_bookmarked,
            detail: feed.detail ? adjustAssetUris(feed.detail) : null,
        }));
        return createPageable(
            feeds,
            createIndicator(indicator),
            data.cursor ? createIndicator(undefined, data.cursor) : undefined,
        );
    }

    async getFollowingNFTs({
        limit = 20,
        indicator,
        chainId,
        walletAddress,
    }: {
        limit?: number;
        indicator?: PageIndicator;
        chainId?: number;
        walletAddress?: string;
    } = {}): Promise<Pageable<NFTFeedV3, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/user/timeline/nft');
        const response = await fireflySessionHolder.fetch<DiscoverNFTResponseV3>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({
                    size: limit,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                    chainId,
                    walletAddress,
                }),
            },
            !walletAddress
                ? {
                      withSession: true,
                  }
                : undefined,
        );

        const data = response.data.result.map<NFTFeedV3>((x) => {
            return {
                ...x,
                bookmarked: x.has_bookmarked,
                detail: x.detail ? adjustAssetUris(x.detail) : null,
            };
        });
        return createPageable(
            data,
            createIndicator(indicator),
            response.data.cursor && data.length > 0 ? createNextIndicator(undefined, response.data.cursor) : undefined,
        );
    }

    async disconnectAccount(connectionId: string, connectionPlatform: ConnectionPlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/accountConnection');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'DELETE',
            body: JSON.stringify({
                connectionPlatform,
                connectionId,
            }),
        });
    }

    async disconnectAccountWithRelatedWallet(connectionId: string, connectionPlatform: ConnectionPlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'DELETE',
            body: JSON.stringify({
                connectionPlatform,
                connectionId,
            }),
        });
    }

    async disconnectWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'DELETE',
            body: JSON.stringify({
                addresses: [address],
            }),
        });
    }

    async isProfileMuted(platform: FireflyPlatform, profileId: string): Promise<boolean> {
        // TODO firefly doesn't support bsky
        if (platform === FireflyPlatform.Bsky) {
            const profile = await getBskyProfileById(profileId);
            return !!profile.viewerContext?.blocking;
        }
        const blockRelationList = await getBlockRelation([
            {
                snsPlatform: platform,
                snsId: profileId,
            },
        ]);
        return !!blockRelationList.find((x) => x.snsId === profileId)?.blocked;
    }

    async isProfileMutedAll(source: ProfilePageSource, id: string) {
        if (source === Source.Bsky) return false;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/isMuteAll', {
            [getPlatformQueryKey(source)]: id,
        });

        const response = await fireflySessionHolder.fetch<IsMutedAllResponse>(url);
        const data = resolveFireflyResponseData(response);
        return data?.isBlockAll ?? false;
    }

    async reportAndDeleteWallet(connection: FireflyWalletConnection, reason: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/wallet/report');

        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                web3Id: connection.twitterId,
                walletAddress: connection.address,
                reportReason: reason,
                sources: connection.sources?.map((x) => x.source).join(',') || '[]',
            }),
        });
    }

    async muteProfileAll(identity: FireflyIdentity) {
        if (identity.source === Source.Bsky) return;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/muteAll', {
            [getPlatformQueryKey(identity.source)]: identity.id,
        });

        await fireflySessionHolder.fetch<MuteAllResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                [getPlatformQueryKey(identity.source)]: identity.id,
            }),
        });
    }

    async getAllConnections() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        const response = await fireflySessionHolder.fetchWithSession<GetAllConnectionsResponse>(url, {
            method: 'GET',
        });
        return formatFireflyConnections(response);
    }

    async getAllConnectionsFromAuthToken(authToken: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        const response = await fetchJson<GetAllConnectionsResponse>(url, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        return formatFireflyConnections(response);
    }

    async getAllConnectionsFormatted() {
        const connections = await this.getAllConnections();

        return {
            fireflyAccount: formatFireflyAccountProfileFromFireflyConnections(connections.account),
            social: {
                [Source.Bsky]: connections.bsky,
                [Source.Lens]: connections.lens,
                [Source.Farcaster]: connections.farcaster,
                [Source.Twitter]: connections.twitter,
            },
            evmConnections: formatWalletConnections(
                [
                    ...connections.wallet.connectedEVM.map((x) => ({ ...x, isConnected: true })),
                    ...connections.wallet.unconnectedEVM.map((x) => ({ ...x, isConnected: false })),
                ],
                connections,
            ),
            solanaConnections: formatWalletConnections(
                [
                    ...connections.wallet.connectedSolana.map((x) => ({ ...x, isConnected: true })),
                    ...connections.wallet.unconnectedSolana.map((x) => ({ ...x, isConnected: false })),
                ],
                connections,
            ),
            connected: formatWalletConnections(connections.wallet.connected, connections),
            related: formatWalletConnections(connections.wallet.unconnected, connections),
            __origin__: connections,
        };
    }

    async blockWallet(address: string) {
        return block('address', address);
    }

    async unblockWallet(address: string) {
        return unblock('address', address);
    }

    async blockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
        return block(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
    }

    async unblockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
        return unblock(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
    }

    async getBlockedWallets(indicator?: PageIndicator): Promise<Pageable<WalletProfile, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/mutelist', {
            size: 20,
            page: indicator?.id ?? 1,
            platform: SourceInURL.Wallet,
        });
        const response = await fireflySessionHolder.fetch<BlockedUsersResponse>(url);

        const data = await Promise.all(
            (response.data?.blocks ?? []).map(async (item) => {
                const walletProfile = await getWalletProfileByAddressOrEns(item.address, true);
                return {
                    ...(walletProfile || {
                        address: item.address as Address,
                        blockchain: NetworkType.Ethereum,
                        is_connected: false,
                        verifiedSources: [],
                    }),
                    blocked: true,
                };
            }),
        );

        return createPageable(
            data,
            createIndicator(indicator),
            response.data?.nextPage ? createNextIndicator(indicator, `${response.data?.nextPage}`) : undefined,
        );
    }

    async isFollowingWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/follow/wallet');
        const response = await fireflySessionHolder.fetch<WalletsFollowStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                addresses: [address],
            }),
        });
        if (!response.data) return false;
        return response.data.some((x) => x.is_followed && isSameAddress(x.address, address));
    }

    async getProfilePolymarketTimeline(
        address: string | string[],
        platformFollowing: SourceInURL | 'all' = 'all',
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');

        const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing,
                walletAddresses: Array.isArray(address) ? address : [address],
                size: 25,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getFollowingPolymarketTimeline(
        platformFollowing: SourceInURL | 'all' = 'all',
        indicator?: PageIndicator,
        size = 25,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/polymarket');
        const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing,
                size,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getFollowingSwapTimeline(
        chains: number[], // array of chain ids
        tokenAddress?: string,
        indicator?: PageIndicator,
        size = 25,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing: 'all',
                chains: chains.length ? chains.join(',') : undefined,
                tokenAddress,
                size,
                cursor: indicator?.id,
            }),
        });

        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getSwapTimelineByAddress(
        address: string | string[],
        chains: number[],
        tokenAddress?: string,
        indicator?: PageIndicator,
        size = 25,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                walletAddresses: Array.isArray(address) ? address : [address],
                chains: chains.length ? chains.join(',') : undefined,
                tokenAddress,
                size,
                cursor: indicator?.id,
            }),
        });

        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getFollowingTraderCount(tokens: Array<{ chain_id: number; token_address: string }>) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/swap/following_count');
        return fireflySessionHolder.withSession(async (session) => {
            if (!session) return null;

            const response = await fireflySessionHolder.fetch<FollowingTraderCountResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    list: tokens,
                }),
            });
            const data = resolveFireflyResponseData(response);
            return data;
        });
    }

    async getSwapActivityByHash(hash: string, chainId: number) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/swap/detail');
        const response = await fireflySessionHolder.fetch<SwapActivityDetail>(url, {
            method: 'POST',
            body: JSON.stringify({
                list: [
                    {
                        hash,
                        chain_id: chainId,
                    },
                ],
                is_realtime: false,
            }),
        });

        const data = resolveFireflyResponseData(response);

        const result = first(data);
        return result;
    }

    async createTxReaction(
        reaction_type: TxReactionType,
        platform_id: string,
        reaction_id: string,
        reaction_owner_id: string,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/reaction/create');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                platform_id,
                reaction_type,
                reaction_id,
                reaction_owner_id,
            }),
        });
        return true;
    }

    async removeTxReaction(reaction_type: TxReactionType, reaction_ids: string[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/reaction/remove');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                reaction_type,
                reaction_ids,
            }),
        });
        return true;
    }

    async searchTokens(query: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/token/search_data', {
            query,
        });
        const response = await fireflySessionHolder.fetch<SearchTokenResponse>(url);
        const data = resolveFireflyResponseData(response);

        return createPageable(data.coins ?? EMPTY_LIST, createIndicator(undefined));
    }
    async searchTokenInfos(keyword: string, fuzzy = false) {
        if (process.env.NODE_ENV === 'development') {
            console.assert(keyword, 'keyword is required');
        }
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/search', {
            query: keyword,
            full: fuzzy ? 0 : 1,
        });
        const response = await fireflySessionHolder.fetch<SearchTokenInfosResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getSingleCoin(options: GetTokenOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v2/token/single_token', options);

        const response = await fireflySessionHolder.fetch<Response<TokenWithMarketData>>(url);
        return resolveFireflyResponseData(response);
    }
    async getTokenByCoinId(coinId: string, chainId?: number, address?: string) {
        return this.getSingleCoin({ coingecko_id: coinId, chain_id: chainId, address });
    }
    async getTokenByAddress(chainId: number, address: string) {
        return this.getSingleCoin({ address, chain_id: chainId });
    }

    async searchCollections(keyword: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/collectible', {
            keyword,
        });

        const response = await fireflySessionHolder.fetch<SearchNFTResponse>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);

        return createPageable((data.list || []).map(fixCollection), createIndicator(undefined));
    }

    async getTokenPriceStats(options: TokenPriceStatsOptions): Promise<NonNullable<TokenPriceStatsResponse['data']>> {
        const params = { ...options } as TokenPriceStatsOptions;
        if (params.coingecko_id) {
            params.address = undefined;
        } else if (params.address && isZeroAddressEthereum(params.address)) {
            params.address = NATIVE_TOKEN_ADDRESS;
        }
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/token_market_chart', {
            ...params,
            vs_currency: 'usd',
            days: options.days || 'max',
        });
        const response = await fireflySessionHolder.fetch<TokenPriceStatsResponse>(url);
        const result = resolveFireflyResponseData(response);
        if (result.prices.length === 1) {
            const record = result.prices[0];
            result.prices.unshift([record[0] - 1, record[1]]);
        }
        result.prices = sortBy(result.prices, (x) => x[0]);
        return result;
    }

    async generateFarcasterSignatures(key: Hex, deadline: number, jwt: string, signal?: AbortSignal) {
        const response = await fetchJson<GenerateFarcasterSignatureResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/v1/farcaster/generate-signatures'),
            {
                method: 'POST',
                body: JSON.stringify({ key, deadline }),
                headers: {
                    authorization: `Bearer ${jwt}`,
                },
                signal,
            },
        );
        return resolveFireflyResponseData(response);
    }

    async getTelegramLoginUrl() {
        const response = await fetchJson<TelegramLoginBotResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/get/telegram/bot/url', { os: 'web' }),
        );
        const data = resolveFireflyResponseData(response);
        return data.url;
    }

    async loginTelegram(telegramToken: string) {
        const response = await fetchJson<LoginResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/telegram/login'), {
            method: 'POST',
            body: JSON.stringify({ telegramToken }),
        });

        const data = resolveFireflyResponseData(response);
        return data;
    }

    async linkDigest(link: string) {
        const response = await fetchJson<LinkDigestResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/linkDigest'), {
            method: 'POST',
            body: JSON.stringify({ link }),
        });

        const data = resolveFireflyResponseData(response);
        if (data.nft) {
            data.nft = adjustAssetUris(data.nft);
            if (data.nft.collection) data.nft.collection = fixCollection(data.nft.collection);
        }
        return data;
    }

    async getSponsorMintStatus(options: Omit<SponsorMintOptions, 'contractExt'>) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/platform/mint/status');
        const response = await fireflySessionHolder.fetch<GetSponsorMintStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });

        return resolveFireflyResponseData(response);
    }

    async mintNFTBySponsor(options: SponsorMintOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/platform');
        const response = await fireflySessionHolder.fetch<MintBySponsorResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });

        const data = resolveFireflyResponseData(response);
        if (!data.status) throw new Error(data.errormessage || 'Failed to mint');

        return data;
    }

    async getFollowingCountByNFT(options: GetFollowingCountByNFTParams) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/asset/ownersInFriends/count', options);
        const response = await fireflySessionHolder.fetch<GetFollowingCountByNFTResponse>(url, { method: 'GET' });
        return resolveFireflyResponseData(response);
    }

    async getArticleCollectStatus(articleId: string, address: string, type: ArticlePlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/mint/status');
        const response = await fireflySessionHolder.fetch<GetCollectStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                articleType: type,
                walletAddress: address,
                originalId: articleId,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async freeCollectArticle(articleId: string, address: string, type: ArticlePlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/mint/article');
        const response = await fireflySessionHolder.fetch<CollectArticleResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                articleType: type,
                walletAddress: address,
                originalId: articleId,
            }),
        });

        const data = resolveFireflyResponseData(response);
        if (!data.status) throw new Error(data.errormessage || 'Failed to collect article');

        return data;
    }

    async getTopProjects(locale: Locale) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/project/top100', {
            days: 1,
            language: locale === Locale.en ? 'en' : 'cn',
        });
        const response = await fetchJson<ProjectResponse>(url, { method: 'GET' });

        return resolveFireflyResponseData(response);
    }

    async getTwitterTopPeople(indicator?: PageIndicator, locale?: Locale) {
        const page = indicator?.id ? Number.parseInt(indicator.id, 10) : 1;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/recommend/x', {
            page,
            page_size: 20,
            rank_type: 'heat',
            language: locale === Locale.en || !locale ? 'en' : 'cn',
        });
        const response = await fetchJson<RootdataPeopleResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async detectAddress(address: string, chainId?: string) {
        if (!address) return null;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/detect', {
            address,
            chainId,
        });
        const response = await fireflySessionHolder.fetch<DetectAddressResponse>(url, { method: 'GET' });

        return resolveFireflyResponseData(response);
    }

    async getDexCoinDetail(chainId: number, address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/dex/coin/detail', {
            chainId,
            address,
        });
        const response = await fireflySessionHolder.fetch<DexCoinDetailResponse>(url);
        return resolveFireflyResponseData(response);
    }
    async getTakoExternalHostedData(ipfs: string) {
        const cid = extractIpfsCID(ipfs);
        const url = urlcat(settings.FIREFLY_ROOT_URL, `v2/farcaster-hub/ipfs/${cid}`);
        const response = await fetchJson<TakoExternalHostedData>(url);
        return response.data;
    }

    async getArticleMetadata(articleId: string, hash: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_transaction/article/add/metadata');
        const response = await fireflySessionHolder.fetch<NFTMintingResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                originalId: articleId,
                hash,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async updateDefaultConnection(platformId: string | number, platform: ConnectionPlatform) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, `/v2/wallet/updateDefaultConnection`);
        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                platform,
                profile_id: `${platformId}`,
            }),
        });
    }

    async generateEmailOTP(email: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/email/generateOTP');
        const response = await fetchJson<GenerateOTPResponse>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({
                    email,
                }),
            },
            {
                noStrictOK: true,
            },
        );

        if (response.code === 1642) throw new OTPExceededMaximumLimit(first(response.error));

        return resolveFireflyResponseData(response);
    }

    async updateProfile(params: FireflyProfileUpdateParams) {
        await fireflySessionHolder.fetchWithSession(urlcat(settings.FIREFLY_ROOT_URL, `/v3/user/profile`), {
            method: 'PUT',
            body: JSON.stringify(params),
        });
    }

    async deleteAccount() {
        await fireflySessionHolder.fetchWithSession(urlcat(settings.FIREFLY_ROOT_URL, `/v3/auth/account/delete`), {
            method: 'DELETE',
        });
    }

    async uploadNotificationSubscription(fcmToken: string, deviceId: string) {
        await fireflySessionHolder.fetchWithSession(
            urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/uploadDeviceToken'),
            {
                method: 'POST',
                body: JSON.stringify({
                    deviceId,
                    token: fcmToken,
                    platform: 'web',
                }),
            },
        );
    }

    async getWalletRelation(walletAddress: string) {
        const walletType = isValidAddressSolana(walletAddress) ? 'solana' : 'evm';
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/relation', {
            walletAddress,
            walletType,
        });
        const response = await fetchJson<WalletRelationResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async checkCustodyWallet(fid: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/checkCustodyWallet', {
            fid,
        });
        const response = await fireflySessionHolder.fetchWithSession<Response<boolean>>(url);
        const data = resolveFireflyResponseData(response);
        return data;
    }

    async signMessageWithCustodyWallet(fid: string, message: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/signMessage');
        const response = await fireflySessionHolder.fetchWithSession<Response<{ signatureMessage: string }>>(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: Number.parseInt(fid, 10),
                message,
            }),
        });
        const data = resolveFireflyResponseData(response);
        return data.signatureMessage;
    }

    async getPOAPs(wallet: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/poap', {
            walletAddress: wallet,
        });
        const response = await fetchJson<PoapResponse>(url);
        return response.data;
    }
    async getPOAP(tokenId: string) {
        // cspell:ignore tokenid
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/detail_by_tokenid', {
            tokenId,
        });
        const response = await fetchJson<PoapDetailResponse>(url);
        return response.data;
    }

    async getPoapHolders(eventId: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
            eventId,
            limit: 20,
            offset: indicator?.id || undefined,
        });
        const response = await fetchJson<PoapHoldersResponse>(url);
        const nextOffset = response.data.tokens.length ? response.data.limit + response.data.offset : undefined;
        return createPageable(
            response.data.tokens,
            indicator,
            nextOffset ? createNextIndicator(indicator, nextOffset.toString()) : undefined,
        );
    }
    async getPoapHolderCount(eventId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
            eventId,
        });
        const response = await fetchJson<PoapHoldersResponse>(url);
        return response.data.total;
    }

    async getNFTDetails(chainId: number, list: Array<{ contract_address: string; token_id: string }>) {
        if (!list.length || !NFTSCAN_CHAIN_IDS.includes(chainId)) return [];
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detail');
        const response = await fetchJson<NFTDetailResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                chainId,
                list,
            }),
        });
        return response.data.map(adjustAssetUris);
    }
    async getNFTDetail(chainId: number, contractAddress: string, tokenId: string) {
        const nfts = await this.getNFTDetails(chainId, [{ contract_address: contractAddress, token_id: tokenId }]);
        return nfts[0];
    }

    async getCollection(chainId: number, contractAddress: string) {
        if (!NFTSCAN_CHAIN_IDS.includes(chainId)) return null;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection', {
            chainId,
            contractAddress,
        });
        const response = await fetchJson<CollectionResponse>(url);
        if (!response.data) return null;
        if ('chain_id' in response.data && Object.keys(response.data).length <= 1) return null;
        return fixCollection(response.data);
    }

    async detectCollection(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detect', {
            address,
        });
        const response = await fetchJson<CollectionResponse>(url);
        if (!response.data) return null;
        return fixCollection(response.data);
    }

    async getCollectionItems(chainId: number, contractAddress: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/items', {
            chainId,
            contractAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<CollectionItemsResponse>(url);
        const list = (response.data?.content || []).map(adjustAssetUris);
        return createPageable(
            list,
            createIndicator(indicator),
            response.data?.next ? createNextIndicator(indicator, response.data.next) : undefined,
        );
    }

    async getCollections(list: Array<{ contractAddress: string; chainId: number }>) {
        const promises = list.map(async ({ contractAddress, chainId }) => {
            return this.getCollection(chainId, contractAddress);
        });
        const results = await Promise.allSettled(promises);
        return compact(results.map((x) => (x.status === 'fulfilled' ? x.value : null))).map(fixCollection);
    }

    async getUserCollections(chainId: number, walletAddress: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own/collection', {
            chainId,
            walletAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<CollectionsResponse>(url);
        const collections = (response.data?.collections || []).map(fixCollection);
        return createPageable(
            collections,
            createIndicator(indicator),
            response.data?.cursor && collections.length
                ? createNextIndicator(indicator, response.data.cursor)
                : undefined,
        );
    }

    async getUserCollectionNFTs(
        walletAddress: string,
        chainId: number,
        contractAddress: string,
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own', {
            walletAddress,
            chainId,
            contractAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJson<NFTDetailsResponse>(url);
        const list = (response.data?.nfts || []).map(adjustAssetUris);
        return createPageable(
            list,
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }

    async getCollectionHolders(chainId: number, contractAddress: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/holder', {
            chainId,
            contractAddress,
            size: 100,
        });
        const response = await fetchJson<HoldersResponse>(url);
        return response.data || EMPTY_LIST;
    }

    async getCollectionStatistics(chainId: number, contractAddress: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/statistics', {
            chainId,
            contractAddress,
        });
        const response = await fetchJson<CollectionStatisticsResponse>(url);
        return response.data;
    }

    async getTrendingNFTs(size = 20) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/trending', { size });
        const response = await fetchJson<TrendingNFTsResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async loginFarcasterWithWallet(
        sysAccount: string,
        originalMessage: string,
        signatureMessage: string,
        isForce: boolean,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/login/fid/wallet');
        const body = {
            sysAccount,
            originalMessage,
            signatureMessage,
            isForce,
        };
        let response = await fireflySessionHolder.fetch<LoginFarcasterWithWalletResponse>(
            url,
            {
                method: 'POST',
                body: JSON.stringify(body),
            },
            {
                noStrictOK: true,
            },
        );
        if (response.code === 232) {
            response = await fireflySessionHolder.fetchWithoutSession<LoginFarcasterWithWalletResponse>(url, {
                method: 'POST',
                body: JSON.stringify(body),
            });
        }
        return resolveFireflyResponseData(response);
    }

    async getTrumpTruthSocialPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/truthsocial_trump_timeline', {
            size: 25,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<TrumpTruthSocialPostsResponse>(url);
        const posts = (response.data?.result || []).filter((x) => !x.has_reblog).map(formatPostsFromTruthSocial);

        return createPageable(
            posts,
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
        );
    }

    async getTruthSocialPostById(truthId: string): Promise<Post | null> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/truthsocial_trump_detail', {
            truth_id: truthId,
        });
        const response = await fireflySessionHolder.fetch<TruthSocialPostResponse>(url);
        if (!response.data) return null;

        return formatPostsFromTruthSocial(response.data);
    }

    async getDesktopLinkInfo() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/linkInfo');
        const response = await fetchJson<DesktopLinkInfoResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getDesktopStatus(session: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/desktop/statusV2');
        const response = await fetchJson<DesktopLinkInfoStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ session }),
        });
        return resolveFireflyResponseData(response);
    }

    async setPasscode(passcode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/set-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
        });
    }

    async checkPasscode(passcode: string, noStrictOK?: boolean) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-passcode');

        return await fireflySessionHolder.fetch<Response<{}>>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
            },
            { noStrictOK },
        );
    }

    async updatePasscode(oldPasscode: string, newPasscode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/update-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                oldPasscode: encryptPasscode(oldPasscode),
                newPasscode: encryptPasscode(newPasscode),
            }),
        });
    }

    async resetPasscode() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/reset-passcode');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
        });
    }

    async getMetricsStatus() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-login-metrics');
        const response = await fireflySessionHolder.fetch<MetricsStatusResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async uploadMetrics(passcode: string, metrics: MetricsItemToUpload[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/upload');

        const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
            method: 'POST',
            body: JSON.stringify({
                metrics,
                passcode: encryptPasscode(passcode),
                client_os: 'web',
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async deleteMetrics(passcode: string, identities: string[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/delete');
        const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
            method: 'POST',
            body: JSON.stringify({
                passcode: encryptPasscode(passcode),
                metaInfoIds: identities,
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async downloadMetaInfo() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download-meta-info');
        const response = await fireflySessionHolder.fetch<MetricsDownloadMetaInfoResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async downloadMetrics(passcode: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download', {
            passcode: encryptPasscode(passcode),
        });
        const response = await fireflySessionHolder.fetch<MetricsDownloadResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async getTipsTransactionDetail(txHash: string, type: TipsNotificationType) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/token_tips/detail', {
            tx_hash: txHash,
            source: type,
        });
        const response = await fireflySessionHolder.fetch<TipsDetailResponse>(url);
        const data = resolveFireflyResponseData(response);

        return data;
    }

    async createPrivyWallet() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/create/privy/user');
        const response = await fireflySessionHolder.fetch<PrivyWalletResponse>(url, {
            method: 'POST',
        });
        return resolveFireflyResponseData(response);
    }

    async getWalletHistoryTransactions(
        chains: number[],
        address: string,
        options?: {
            indicator?: PageIndicator;
        },
    ) {
        const indicator = options?.indicator;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_history/transactions', {
            chains: chains.join(','),
            address,
            cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
        });
        const response = await fireflySessionHolder.fetch<WalletHistoryTransactionsResponse>(url, {
            method: 'GET',
        });
        const result = resolveFireflyResponseData(response);
        return createPageable(
            result.list,
            createIndicator(),
            result.cursor ? createNextIndicator(undefined, result.cursor) : undefined,
        );
    }

    async getMultiChainTokenList(addresses: string[], chains: number[]) {
        // cspell: disable-next-line
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/swap/wallet/asset/muti-chain', {
            chains: chains.join(','),
            addresses: addresses.join(','),
        });
        const response = await fetchJson<GetMultiChainTokenListResponse>(url, {
            method: 'GET',
        });
        return (response.data?.data?.tokenAssets ?? EMPTY_LIST) as TokenAsset[];
    }

    async getPostByShortId(shortId: string, handle: string, profileId?: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/cast', {
            hash: shortId,
            fid: profileId,
            needRootParentHash: true,
            hashHandle: handle,
        });
        const { data: cast } = await fireflySessionHolder.fetch<CastResponse>(url, {
            method: 'GET',
        });

        const post = cast ? formatFarcasterPostFromFirefly(cast) : null;
        if (!post) throw new NotFoundError('Post not found');
        return post;
    }

    async getPostByAnonymousRateLimits() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous/availability');
        const response = await fireflySessionHolder.fetch<PostByAnonymousRateLimitsResponse>(url);

        return resolveFireflyResponseData(response);
    }

    async createAnonymousPost(options: CreateAnonymousPostOptions) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous');
        const response = await fireflySessionHolder.fetch<CreateAnonymousPostResponse>(url, {
            method: 'POST',
            body: JSON.stringify(options),
        });
        return resolveFireflyResponseData(response);
    }

    async getAnonymousPostById(id: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/post/anonymous/post', {
            postId: id,
        });
        const response = await fireflySessionHolder.fetch<GetAnonymousPostResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async checkGenesisSparksAccounts(
        source: ProfilePageSource,
        idAndHandleList: Array<{ id: string; handle: string }>,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/genesis/accountactive/check');
        const response = await fireflySessionHolder.fetch<GenesisSparksAccountsResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                infoList: idAndHandleList.map((x) => ({
                    platform_id: x.id,
                    handle: x.handle,
                    platform: resolveSourceInUrlForApi(source),
                })),
            }),
        });

        return resolveFireflyResponseData(response);
    }

    async getExploreSwitchConfigList(deviceId?: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/explore/switch/get', {
            device_id: deviceId,
        });
        const response = await fireflySessionHolder.fetch<GetExploreSwitchConfigResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async setExploreSwitchConfig(switchType: ExploreSwitchType, status: boolean) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/explore/switch/set');
        const response = await fireflySessionHolder.fetch<Response<unknown>>(url, {
            method: 'POST',
            body: JSON.stringify({
                list: [
                    {
                        platform: 'explore',
                        explore_type: switchType,
                        state: status,
                    },
                ],
            }),
        });
        return resolveFireflyResponseData(response);
    }

    async reportPost(
        platform: FireflyPlatform,
        platformId: string,
        mediaType: string[],
        postId: string,
        relationId: string,
        options?: {
            content?: string;
        },
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/report/post/post_create');
        return fireflySessionHolder.fetchWithSession<string>(url, {
            method: 'POST',
            body: JSON.stringify({
                platform,
                platform_id: platformId,
                media_type: mediaType,
                post_id: postId,
                ua_type: 'web',
                relation_id: relationId,
                post_time: Math.floor(Date.now() / 1000),
                content: options?.content,
            }),
        });
    }

    async getPolymarketProfile(address: string, isProxyAddress?: boolean) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/profile/info');
        const response = await fireflySessionHolder.fetch<Response<PolymarketProfileData>>(url, {
            method: 'POST',
            body: JSON.stringify({ wallet: address, is_polymarketProxy: isProxyAddress }),
        });
        return resolveFireflyResponseData(response);
    }

    async getPolymarketPositionHistory({
        address,
        indicator,
        isProxyAddress,
        limit = 20,
        isClaim = false, // true: current positions; false: history positions
    }: {
        address: string;
        indicator?: PageIndicator;
        isProxyAddress?: boolean;
        limit?: number;
        isClaim?: boolean;
    }) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/positions/info');
        const response = await fireflySessionHolder.fetch<
            Response<{
                data: PolymarketPositionData[];
                cursor: string | null;
            }>
        >(url, {
            method: 'POST',
            body: JSON.stringify({
                is_polymarketProxy: isProxyAddress,
                limit,
                cursor: indicator?.id || undefined,
                wallet: address,
                is_claim: isClaim,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data.data,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getPolymarketTradeHistory({
        address,
        indicator,
        limit = 20,
    }: {
        address: string;
        indicator?: PageIndicator;
        limit?: number;
    }) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');
        const response = await fireflySessionHolder.fetch<
            Response<{
                result: PolymarketTradeData[];
                cursor: string | null;
            }>
        >(url, {
            method: 'POST',
            body: JSON.stringify({
                walletAddresses: [address],
                size: limit,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data.result,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
    async getSparksAccountDetails(accountId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/genesis/spark/profile');
        const response = await fireflySessionHolder.fetch<SparksAccountResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ uid: accountId }),
        });
        return resolveFireflyResponseData(response);
    }
}

export { FireflyEndpoint };
export const fireflyEndpointProvider = new FireflyEndpoint();
