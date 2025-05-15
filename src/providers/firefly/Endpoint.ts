import { compact, first } from 'lodash-es';
import urlcat from 'urlcat';
import { type Address, type Hex, isHex } from 'viem';

import { queryClient } from '@/configs/queryClient.js';
import { DEBANK_CHAIN_TO_CHAIN_ID_MAP, DEBANK_CHAINS } from '@/constants/chain.js';
import {
    ConnectionPlatform,
    FireflyPlatform,
    Locale,
    NetworkType,
    type ProfilePageSource,
    type SocialSource,
    Source,
    SourceInURL,
} from '@/constants/enum.js';
import { OTPExceededMaximumLimit } from '@/constants/error.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { NATIVE_TOKEN_ADDRESS } from '@/constants/okx.js';
import { SetQueryDataForAddWallet } from '@/decorators/SetQueryDataForAddWallet.js';
import { SetQueryDataForMuteAllProfiles } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBlockWallet, SetQueryDataForMuteAllWallets } from '@/decorators/SetQueryDataForBlockWallet.js';
import {
    SetQueryDataForDeleteWallet,
    SetQueryDataForReportAndDeleteWallet,
} from '@/decorators/SetQueryDataForDeleteWallet.js';
import { SetQueryDataForWatchWallet } from '@/decorators/SetQueryDataForWatchWallet.js';
import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { getPublicKeyInHexFromSession } from '@/helpers/ed25519.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatFarcasterProfileFromSuggestedFollow } from '@/helpers/formatFarcasterProfileFromSuggestedFollow.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { formatLensProfileFromSuggestedFollow } from '@/helpers/formatLensProfile.js';
import { formatPostsFromTruthSocial } from '@/helpers/formatPostsFromTruthSocial.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getAddressType } from '@/helpers/getAddressType.js';
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
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveNFTId } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import type { Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import {
    type BindWalletResponse,
    type BlockedUsersResponse,
    type BlockFields,
    type BlockRelationResponse,
    type BlockUserResponse,
    type CollectArticleResponse,
    type CollectionItemsResponse,
    type CollectionResponse,
    type CollectionsResponse,
    type CollectionStatisticsResponse,
    type DebankTokensResponse,
    type DetectAddressResponse,
    type EmptyResponse,
    type FireflyIdentity,
    type FireflyProfile,
    type FireflyProfileUpdateParams,
    type FireflyWalletConnection,
    type GenerateFarcasterSignatureResponse,
    type GenerateOTPResponse,
    type GetAllConnectionsResponse,
    type GetCollectStatusResponse,
    type GetFarcasterSuggestedFollowUserResponse,
    type GetFollowingCountByNFTParams,
    type GetFollowingCountByNFTResponse,
    type GetLensSuggestedFollowUserResponse,
    type GetSponsorMintStatusResponse,
    type HexResponse,
    type HoldersResponse,
    type IsMutedAllResponse,
    type LinkDigestResponse,
    type LoginFarcasterWithWalletResponse,
    type LoginResponse,
    type MintBySponsorResponse,
    type MuteAllResponse,
    type NFTDetailsResponse,
    type NFTMintingResponse,
    type PlatformIdentityKey,
    type PolymarketActivityTimeline,
    type ProjectResponse,
    type RelationResponse,
    type Response,
    type SearchNFTResponse,
    type SearchProfileResponse,
    type SearchTokenInfosResponse,
    type SearchTokenResponse,
    type SponsorMintOptions,
    type SwapActivityDetail,
    type SwapActivityTimeline,
    type TakoExternalHostedData,
    type TelegramLoginBotResponse,
    type TokenPriceStatsOptions,
    type TokenPriceStatsResponse,
    type TokenWithMarketData,
    type TrumpTruthSocialPostsResponse,
    type TruthSocialPostResponse,
    type TwitterUserInfoResponse,
    type TwitterUserV2Response,
    type WalletProfile,
    type WalletProfileResponse,
    type WalletRelationResponse,
    type WalletsFollowStatusResponse,
    type WalletsStatusResponse,
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
import type { Post } from '@/providers/types/SocialMedia.js';
import { convertBskyHandleToDid } from '@/services/convertBskyHandleToDid.js';
import { getWalletProfileByAddressOrEns } from '@/services/getWalletProfileByAddressOrEns.js';
import { muteAllSocialProfiles } from '@/services/muteAllSocialProfiles.js';
import { settings } from '@/settings/index.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

function resolveDebankChain(debankChain: string) {
    const chain = DEBANK_CHAINS.find((chain) => chain.id === debankChain);
    if (chain) return { id: chain.community_id, logoUrl: chain.logo_url };

    if (debankChain in DEBANK_CHAIN_TO_CHAIN_ID_MAP) {
        return { id: DEBANK_CHAIN_TO_CHAIN_ID_MAP[debankChain] };
    }
    return;
}

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
@SetQueryDataForMuteAllProfiles()
@SetQueryDataForMuteAllWallets()
class FireflyEndpoint {
    async muteNFT(collectionId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/mute/collection');
        await fireflySessionHolder.fetch(
            url,
            {
                method: 'POST',
                body: JSON.stringify({
                    collection_id: collectionId,
                }),
            },
            {
                withSession: true,
            },
        );
    }

    /**
     * Reports a scam NFT to NFTScan
     */
    async reportNFT(chainId: number, address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/reportNFT', {
            chainId,
            contractAddress: address,
        });
        await fireflySessionHolder.fetch(
            url,
            { method: 'GET' },
            {
                withSession: true,
            },
        );
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

    /**
     * Kick off the process of connecting particle wallets with firefly account.
     * @returns
     */
    async reportParticle() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/report/particle/user');
        return fireflySessionHolder.fetch<void>(url, {
            method: 'GET',
        });
    }

    async reportFarcasterSigner(session: FarcasterSession, signal?: AbortSignal) {
        // ensure session is available
        fireflySessionHolder.assertSession('[reportFarcasterSigner] firefly session required');

        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/upSignerConfig');

        await fireflySessionHolder.fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: session.profileId,
                signerPublickey: await getPublicKeyInHexFromSession(session),
                signerPrivatekey: session.token,
            }),
            signal,
        });
    }

    async getAllPlatformProfileFromFirefly(identity: FireflyIdentity, isAuthRequired: boolean, forceHandle = false) {
        const queryKey = resolveValue(() => {
            switch (identity.source) {
                case Source.Lens:
                    if (isHex(identity.id) && !forceHandle) return 'lensProfileId';
                    return 'lensHandle';
                case Source.Farcaster:
                    return forceHandle ? 'farcasterUsername' : 'fid';
                case Source.Twitter:
                    return /^\d+$/.test(identity.id) && !forceHandle ? 'twitterId' : 'twitterHandle';
                case Source.Wallet:
                case Source.WalletMix:
                    switch (getAddressType(identity.id)) {
                        case NetworkType.Ethereum:
                            return 'walletAddress';
                        case NetworkType.Solana:
                            return 'solanaAddress';
                        default:
                            return 'walletAddress';
                    }
                case Source.Bsky:
                    if (identity.id.startsWith('did:plc:')) return 'bskyDid';
                    return 'bskyHandle';
                default:
                    return '';
            }
        });

        return FireflyEndpointProvider.getAllRelatedProfileInfo(
            {
                [`${queryKey}`]: identity.id,
            },
            isAuthRequired,
        );
    }

    async getAllTokenList(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/misc/all_token_list', {
            address,
        });
        const result = await fireflySessionHolder.fetch<DebankTokensResponse>(url);
        return result.data?.list ?? [];
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
                chainId: chain?.id,
                chainLogoUrl: chain?.logoUrl,
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
        const response = await fireflySessionHolder.fetch<GetFarcasterSuggestedFollowUserResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, `/v2/farcaster-hub/suggested_follow_list`, {
                cursor: indicator?.id,
            }),
        );
        if (!response.data) return createPageable(EMPTY_LIST, indicator);
        const profiles =
            response.data?.suggestedFollowList.map((user) => formatFarcasterProfileFromSuggestedFollow(user)) ?? [];
        return createPageable(profiles, indicator, createIndicator(indicator, `${response.data.cursor}`));
    }

    async getMessageToSignForBindWallet(address: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/messageToSign', {
            address,
        });

        const response = await fireflySessionHolder.fetch<Response<{ message: Hex }>>(url, {
            method: 'GET',
        });

        const { message } = resolveFireflyResponseData(response);
        if (!message) throw new Error('Failed to get message to sign');

        return message;
    }

    async getAllPlatformProfileByIdentity(
        identity: FireflyIdentity,
        isAuthRequired: boolean,
    ): Promise<FireflyProfile[]> {
        const profiles = await FireflyEndpointProvider.getAllPlatformProfileFromFirefly(identity, isAuthRequired);
        return formatFireflyProfilesFromWalletProfiles(profiles) as FireflyProfile[];
    }

    /**
     * Backend does not support using bsky handle directly, so we convert it to a bsky DID for compatibility.
     */
    private async resolveRelatedProfileParams(options?: Partial<Record<PlatformIdentityKey, string>>) {
        if (options?.bskyHandle) {
            const did = await convertBskyHandleToDid(options.bskyHandle);
            if (did) options.bskyDid = did;
        }
        return options || {};
    }

    private async getWalletProfileWithHacked(profiles: WalletProfile[]) {
        const walletsStatus = await this.getWalletsStatus(profiles.map((x) => x.address));
        return profiles.map<WalletProfile>((profile) => ({
            ...profile,
            hacked: walletsStatus.some((x) => isSameAddress(x.address, profile.address) && x.is_hack),
        }));
    }

    async getAllRelatedProfileInfo(options?: Partial<Record<PlatformIdentityKey, string>>, isAuthRequired?: boolean) {
        const params = await this.resolveRelatedProfileParams(options);
        // cspell: disable-next-line
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/profileinfo', params);
        const response = await fireflySessionHolder.fetch<WalletProfileResponse>(
            url,
            {
                method: 'GET',
            },
            {
                withSession: isAuthRequired,
            },
        );
        const data = resolveFireflyResponseData(response);
        if (data.walletProfiles.length)
            data.walletProfiles = await this.getWalletProfileWithHacked(data.walletProfiles);
        return data;
    }

    async getAllRelatedProfiles(options?: Partial<Record<PlatformIdentityKey, string>>, isAuthRequired?: boolean) {
        const params = await this.resolveRelatedProfileParams(options);
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/profile', params);
        const response = await fireflySessionHolder.fetch<WalletProfileResponse>(
            url,
            {
                method: 'GET',
            },
            {
                withSession: isAuthRequired,
            },
        );
        const data = resolveFireflyResponseData(response);
        if (data.walletProfiles.length)
            data.walletProfiles = await this.getWalletProfileWithHacked(data.walletProfiles);
        return data;
    }

    async getNextIDRelations(platform: string, identity: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/relations', {
            platform,
            identity,
        });

        const response = await fireflySessionHolder.fetch<RelationResponse>(url, {
            method: 'GET',
        });

        const relations = resolveFireflyResponseData(response);
        return relations;
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
            data.list,
            indicator,
            data.cursor && data.list.length ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async discoverNFTs({
        indicator,
        limit = 20,
    }: {
        indicator?: PageIndicator;
        limit?: number;
    } = {}) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/nft/v3', {
            size: limit,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetchWithoutSession<DiscoverNFTResponseV3>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const nftIds = data.result.map((feed) => resolveNFTId(feed.chain_id, feed.contract_address, feed.token_id));
        const bookmarks = nftIds.length
            ? await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))
            : [];
        const bookmarksMap = new Map<string, boolean>(
            (bookmarks || []).map((x) => [x.post_id.toLowerCase(), x.has_book_marked]),
        );
        const feeds = bookmarksMap.size
            ? data.result.map<NFTFeedV3>((feed) => {
                  const id = resolveNFTId(feed.chain_id, feed.contract_address, feed.token_id);
                  return {
                      ...feed,
                      bookmarked: bookmarksMap.get(id.toLowerCase()),
                  };
              })
            : data.result;
        return createPageable(
            feeds.map((x) => ({ ...x, detail: x.detail ? adjustAssetUris(x.detail) : null })),
            indicator,
            data.cursor ? createIndicator(undefined, data.cursor) : undefined,
        );
    }

    async getFollowingNFTs({
        limit = 20,
        indicator,
        chainId = EthereumChainId.Mainnet,
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
            {
                withSession: !walletAddress,
            },
        );
        const nftIds = response.data.result.map((x) =>
            resolveNFTId(x.chain_id || EthereumChainId.Mainnet, x.contract_address, x.token_id),
        );
        const bookmarks = nftIds.length
            ? await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))
            : [];
        const bookmarksMap = new Map<string, boolean>(
            (bookmarks || []).map((x) => [x.post_id.toLowerCase(), x.has_book_marked]),
        );
        const data = bookmarksMap.size
            ? response.data.result.map<NFTFeedV3>((x) => {
                  const id = resolveNFTId(x.chain_id || EthereumChainId.Mainnet, x.contract_address, x.token_id);
                  return {
                      ...x,
                      has_bookmarked: bookmarksMap.get(id) || false,
                  };
              })
            : response.data.result;
        return createPageable(
            data.map((x) => ({ ...x, detail: x.detail ? adjustAssetUris(x.detail) : null })),
            createIndicator(indicator),
            response.data.cursor && data.length > 0 ? createNextIndicator(undefined, response.data.cursor) : undefined,
        );
    }

    async getBlockRelation(conditions: Array<{ snsPlatform: FireflyPlatform; snsId: string }>) {
        return fireflySessionHolder.withSession(async (session) => {
            if (!session) return [];
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/muteRelation');
            const response = await fireflySessionHolder.fetch<BlockRelationResponse>(url, {
                method: 'POST',
                body: JSON.stringify({
                    conditions,
                }),
            });
            return response.data ?? [];
        });
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
            const profile = await BskySocialMediaProvider.getProfileById(profileId);
            return !!profile.viewerContext?.blocking;
        }
        const blockRelationList = await this.getBlockRelation([
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
                sources: connection.sources.map((x) => x.source).join(','),
            }),
        });
    }

    async muteProfileAll(identity: FireflyIdentity) {
        if (identity.source !== Source.Bsky) {
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

        return await muteAllSocialProfiles(identity);
    }

    async getAllConnections() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        const response = await fireflySessionHolder.fetch<GetAllConnectionsResponse>(url, {
            method: 'GET',
        });
        return resolveFireflyResponseData(response);
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

    async getTwitterUserInfo(screenName: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/twitter/userinfo', {
            screenName,
        });
        const response = await fetchJSON<TwitterUserInfoResponse>(url, {
            method: 'GET',
        });
        return resolveFireflyResponseData(response);
    }

    async getUserInfoById(userId: string) {
        if (!userId) return null;
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/api/twitter/user/:userId', {
            userId,
        });
        const response = await fetchJSON<TwitterUserV2Response>(url);
        return resolveFireflyResponseData(response);
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

    async getFollowingPolymarketTimeline(platformFollowing: SourceInURL | 'all' = 'all', indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/polymarket');

        const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing,
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

    async getFollowingSwapTimeline(
        chains: number[], // array of chain ids
        tokenAddress?: string,
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing: 'all',
                chains: chains.length ? chains.join(',') : undefined,
                tokenAddress,
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

    async getSwapTimelineByAddress(
        address: string | string[],
        chains: number[],
        tokenAddress?: string,
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                walletAddresses: Array.isArray(address) ? address : [address],
                chains: chains.length ? chains.join(',') : undefined,
                tokenAddress,
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
                is_realtime: true,
            }),
        });

        const data = resolveFireflyResponseData(response);

        const result = first(data);
        return result;
    }

    async likeCreate(like_type: string, platform_id: string, like_id: string, like_owner_id: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/like/create');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ like_id, like_owner_id, like_type, platform_id }),
        });
        return true;
    }

    async likeRemove(like_id: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/like/remove');
        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({ like_ids: [like_id] }),
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

    async getSingleCoin(options: Record<string, any>) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/token/single_coins', options);

        const response = await fireflySessionHolder.fetch<Response<TokenWithMarketData>>(url);
        return resolveFireflyResponseData(response);
    }
    async getTokenByCoinId(coinId: string, chainId?: number, address?: string) {
        return this.getSingleCoin({ coingecko_id: coinId, chain_id: chainId, address });
    }
    async getTokenByAddress(chainId: number, address: string) {
        return this.getSingleCoin({ address, chain_id: chainId });
    }

    async getTokenBySymbol(symbol: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v2/token/single_token', {
            token_symbol: symbol,
        });

        const response = await fireflySessionHolder.fetch<Response<TokenWithMarketData>>(url);
        return resolveFireflyResponseData(response);
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

    async getTokenPriceStats(options: TokenPriceStatsOptions) {
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
        return resolveFireflyResponseData(response);
    }

    async generateFarcasterSignatures(key: Hex, deadline: number, jwt: string, signal?: AbortSignal) {
        const response = await fetchJSON<GenerateFarcasterSignatureResponse>(
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
        const response = await fetchJSON<TelegramLoginBotResponse>(
            urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/get/telegram/bot/url', { os: 'web' }),
        );

        const data = resolveFireflyResponseData(response);

        return data.url;
    }

    async loginTelegram(telegramToken: string) {
        const response = await fetchJSON<LoginResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v3/auth/telegram/login'), {
            method: 'POST',
            body: JSON.stringify({ telegramToken }),
        });

        const data = resolveFireflyResponseData(response);
        return data;
    }

    async linkDigest(link: string) {
        const response = await fetchJSON<LinkDigestResponse>(urlcat(settings.FIREFLY_ROOT_URL, '/v2/misc/linkDigest'), {
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
        const response = await fetchJSON<ProjectResponse>(url, { method: 'GET' });

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

    async searchTokenInfos(keyword: string, fuzzy = false) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/token/search', {
            query: keyword,
            full: fuzzy ? 0 : 1,
        });
        const response = await fireflySessionHolder.fetch<SearchTokenInfosResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getTakoExternalHostedData(ipfs: string) {
        const cid = extractIpfsCID(ipfs);
        const url = urlcat(settings.FIREFLY_ROOT_URL, `v2/farcaster-hub/ipfs/${cid}`);
        const response = await fetchJSON<TakoExternalHostedData>(url);
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

    async getWalletsStatus(addresses: string[]) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/status');
        const response = await fireflySessionHolder.fetch<WalletsStatusResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                addresses,
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
        const response = await fetchJSON<GenerateOTPResponse>(
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
        const response = await fetchJSON<WalletRelationResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async checkCustodyWallet(fid: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/checkCustodyWallet', {
            fid,
        });
        const response = await fireflySessionHolder.fetch<Response<boolean>>(url);
        const data = resolveFireflyResponseData(response);
        return data;
    }

    async signMessageWithCustodyWallet(fid: string, message: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/signMessage');
        const response = await fireflySessionHolder.fetch<Response<{ signatureMessage: string }>>(url, {
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
        const response = await fetchJSON<PoapResponse>(url);
        return response.data;
    }
    async getPOAP(tokenId: string) {
        // cspell:ignore tokenid
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/detail_by_tokenid', {
            tokenId,
        });
        const response = await fetchJSON<PoapDetailResponse>(url);
        return response.data;
    }

    async getPoapHolders(eventId: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
            eventId,
            limit: 20,
            offset: indicator?.id || undefined,
        });
        const response = await fetchJSON<PoapHoldersResponse>(url);
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
        const response = await fetchJSON<PoapHoldersResponse>(url);
        return response.data.total;
    }

    async getNFTDetails(chainId: number, list: Array<{ contract_address: string; token_id: string }>) {
        if (!list.length || !NFTSCAN_CHAIN_IDS.includes(chainId)) return [];
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detail');
        const response = await fetchJSON<NFTDetailResponse>(url, {
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
        const response = await fetchJSON<CollectionResponse>(url);
        if (!response.data) return null;
        if ('chain_id' in response.data && Object.keys(response.data).length <= 1) return null;
        return fixCollection(response.data);
    }

    async getCollectionItems(chainId: number, contractAddress: string, indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/items', {
            chainId,
            contractAddress,
            cursor: indicator?.id,
        });
        const response = await fetchJSON<CollectionItemsResponse>(url);
        const list = (response.data?.content || []).map(adjustAssetUris);
        return createPageable(
            list,
            createIndicator(indicator),
            response.data?.next ? createNextIndicator(indicator, response.data.next) : undefined,
        );
    }

    async getCollectionByAddress(contractAddress: string) {
        const signal = new AbortController();
        const promises = NFTSCAN_CHAIN_IDS.map(async (chainId) => {
            const result = await this.getCollection(chainId, contractAddress);
            if (result) {
                signal.abort();
                return result;
            }
            throw new Error(`Collection not found: ${contractAddress} on ${chainId}`);
        });
        return Promise.any(promises);
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
        const response = await fetchJSON<CollectionsResponse>(url);
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
        const response = await fetchJSON<NFTDetailsResponse>(url);
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
        const response = await fetchJSON<HoldersResponse>(url);
        return response.data || EMPTY_LIST;
    }

    async getCollectionStatistics(chainId: number, contractAddress: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/statistics', {
            chainId,
            contractAddress,
        });
        const response = await fetchJSON<CollectionStatisticsResponse>(url);
        return response.data;
    }

    async loginFarcasterWithWallet(
        sysAccount: string,
        originalMessage: string,
        signatureMessage: string,
        isForce: boolean,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/login/fid/wallet');
        const response = await fireflySessionHolder.fetch<LoginFarcasterWithWalletResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                sysAccount,
                originalMessage,
                signatureMessage,
                isForce,
            }),
        });
        return resolveFireflyResponseData(response);
    }

    async getTrumpTruthSocialPosts(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/truthsocial_trump_timeline', {
            size: 25,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetch<TrumpTruthSocialPostsResponse>(url);
        const posts = await Promise.all(
            (response.data?.result || []).filter((x) => !x.has_reblog).map(formatPostsFromTruthSocial),
        );

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
}

export { FireflyEndpoint };
export const FireflyEndpointProvider = new FireflyEndpoint();
