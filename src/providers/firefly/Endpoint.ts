import { EthereumChainId } from '@masknet/web3-shared-evm';
import { produce } from 'immer';
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
import { SetQueryDataForAddWallet } from '@/decorators/SetQueryDataForAddWallet.js';
import { SetQueryDataForMuteAllProfiles } from '@/decorators/SetQueryDataForBlockProfile.js';
import { SetQueryDataForBlockWallet, SetQueryDataForMuteAllWallets } from '@/decorators/SetQueryDataForBlockWallet.js';
import {
    SetQueryDataForDeleteWallet,
    SetQueryDataForReportAndDeleteWallet,
} from '@/decorators/SetQueryDataForDeleteWallet.js';
import { SetQueryDataForWatchWallet } from '@/decorators/SetQueryDataForWatchWallet.js';
import { getPublicKeyInHexFromSession } from '@/helpers/ed25519.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatFarcasterProfileFromSuggestedFollow } from '@/helpers/formatFarcasterProfileFromSuggestedFollow.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { formatLensProfileFromSuggestedFollow } from '@/helpers/formatLensProfile.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { extractIpfsCID } from '@/helpers/isIpfsCID.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { isValidAddressEthereum, isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { isZero } from '@/helpers/number.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveNFTFeedChainId } from '@/helpers/resolveNFTFeedChainId.js';
import { resolveNFTId, resolveNFTIdFromAsset } from '@/helpers/resolveNFTIdFromAsset.js';
import { resolveSimpleHashChainId } from '@/helpers/resolveSimpleHashChain.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveValue } from '@/helpers/resolveValue.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import { formatSimpleHashNFT } from '@/providers/simplehash/formatSimpleHashNFT.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';
import type { Article, ArticlePlatform } from '@/providers/types/Article.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import {
    type BindWalletResponse,
    type BlockedUsersResponse,
    type BlockFields,
    type BlockRelationResponse,
    type BlockUserResponse,
    type CollectArticleResponse,
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
    type IsMutedAllResponse,
    type LinkDigestResponse,
    type LoginResponse,
    type MintBySponsorResponse,
    type MuteAllResponse,
    type NFTCollectionsResponse,
    type NFTMintingResponse,
    type PlatformIdentityKey,
    type PolymarketActivityTimeline,
    type ProjectResponse,
    type RelationResponse,
    type Response,
    type SearchNFTResponse,
    type SearchProfileResponse,
    type SearchTokenResponse,
    type SponsorMintOptions,
    type SwapActivityDetail,
    type SwapActivityTimeline,
    type TakoExternalHostedData,
    type TelegramLoginBotResponse,
    type TokenWithMarketData,
    type TwitterUserInfoResponse,
    type TwitterUserV2Response,
    type WalletProfile,
    type WalletProfileResponse,
    type WalletRelationResponse,
    type WalletsFollowStatusResponse,
    type WalletsStatusResponse,
    WatchType,
} from '@/providers/types/Firefly.js';
import type { DiscoverNFTResponseV2, GetFollowingNFTResponse, NFTFeed } from '@/providers/types/NFTs.js';
import { convertBskyHandleToDid } from '@/services/convertBskyHandleToDid.js';
import { getWalletProfileByAddressOrEns } from '@/services/getWalletProfileByAddressOrEns.js';
import { muteAllSocialProfiles } from '@/services/muteAllSocialProfiles.js';
import { settings } from '@/settings/index.js';

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

@SetQueryDataForBlockWallet()
@SetQueryDataForAddWallet()
@SetQueryDataForDeleteWallet()
@SetQueryDataForReportAndDeleteWallet()
@SetQueryDataForWatchWallet()
@SetQueryDataForMuteAllProfiles()
@SetQueryDataForMuteAllWallets()
export class FireflyEndpoint {
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
     * Reports a scam NFT collection based on the provided collectionId.
     *
     * @param {string} collectionId - collection id from Simplehash
     */
    async reportNFT(collectionId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/misc/reportNFT');
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

    /**
     * Retrieve all NFT collections from the linked wallets associated with a particular user.
     *
     * @param params
     * @returns
     */
    async getWalletsNFTCollections(params: { limit?: number; indicator?: PageIndicator; walletAddress: string }) {
        const { indicator, walletAddress, limit } = params ?? {};
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v2/user/walletsNftCollections', {
            walletAddresses: walletAddress,
            size: limit || 25,
            cursor: indicator?.id || undefined,
        });
        const response = await fireflySessionHolder.fetch<NFTCollectionsResponse>(url);
        return createPageable(
            response.data?.collections ?? EMPTY_LIST,
            createIndicator(indicator),
            response.data?.cursor ? createNextIndicator(indicator, `${response.data.cursor}`) : undefined,
        );
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

    async getAllPlatformProfileFromFirefly(identity: FireflyIdentity, isAuthRequired: boolean) {
        const queryKey = resolveValue(() => {
            switch (identity.source) {
                case Source.Lens:
                    if (isHex(identity.id)) return 'lensProfileId';
                    return 'lensHandle';
                case Source.Farcaster:
                    return 'fid';
                case Source.Twitter:
                    return /^\d+$/.test(identity.id) ? 'twitterId' : 'twitterHandle';
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
        const platform = platforms?.map((x) => resolveSourceInUrl(x)).join(','); // There are commas here, without escaping
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
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async discoverNFTs({
        indicator,
        limit = 20,
    }: {
        indicator?: PageIndicator;
        limit?: number;
    } = {}) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/discover/nft', {
            size: limit,
            cursor: indicator?.id,
        });
        const response = await fireflySessionHolder.fetchWithoutSession<DiscoverNFTResponseV2>(url, {
            method: 'GET',
        });
        const data = resolveFireflyResponseData(response);
        const nftIds = data.nfts.flatMap((feed) =>
            feed.trans.token_list.map((x) => resolveNFTId(resolveNFTFeedChainId(feed), feed.trans.token_address, x.id)),
        );
        const bookmarks = nftIds.length
            ? await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))
            : [];
        const simpleHashNFTs = await SimpleHashProvider.getNFTByIds(nftIds);
        const nfts = compact(simpleHashNFTs.map((x) => formatSimpleHashNFT(x, true)));
        return createPageable(
            data.nfts
                .map<NFTFeed>((feed) => ({
                    ...feed,
                    trans: {
                        ...feed.trans,
                        token_list: feed.trans.token_list.map((token) => ({
                            ...token,
                            bookmarked: bookmarks?.find(
                                (x) =>
                                    x.post_id.toLowerCase() ===
                                    resolveNFTId(resolveNFTFeedChainId(feed), feed.trans.token_address, token.id),
                            )?.has_book_marked,
                            nft: nfts.find(
                                (x) => isSameAddress(x.address, feed.trans.token_address) && x.tokenId === token.id,
                            )!,
                        })),
                    },
                }))
                .filter((x) => x.trans.token_list.map((t) => t.nft).filter((t) => t).length),
            indicator,
            data.hasMore && data.cursor ? createIndicator(undefined, data.cursor) : undefined,
        );
    }

    async getFollowingNFTs({
        limit = 20,
        indicator,
        walletAddresses,
    }: {
        limit?: number;
        indicator?: PageIndicator;
        walletAddresses?: string[];
    } = {}) {
        const url = urlcat(
            settings.FIREFLY_ROOT_URL,
            walletAddresses && walletAddresses.length > 0 ? '/v2/user/timeline/nft' : '/v2/timeline/nft',
        );
        const response = await fireflySessionHolder.fetch<GetFollowingNFTResponse>(
            url,
            {
                method: 'POST',
                body: JSON.stringify({
                    size: limit,
                    cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
                    walletAddresses,
                }),
            },
            {
                withSession: !(walletAddresses && walletAddresses.length > 0),
            },
        );
        const nftIds = response.data.result.flatMap((x) => {
            return x.actions.map((action) =>
                resolveNFTId(
                    resolveSimpleHashChainId(x.network) || EthereumChainId.Mainnet,
                    action.contract_address,
                    action.token_id,
                ),
            );
        });
        const bookmarks = nftIds.length
            ? await runInSafeAsync(() => FireflySocialMediaProvider.getBookmarksByIds(FireflyPlatform.NFTs, nftIds))
            : [];
        const simpleHashNFTs = await SimpleHashProvider.getNFTByIds(nftIds);
        const nfts = compact(simpleHashNFTs.map((x) => formatSimpleHashNFT(x, true)));
        const data = response.data.result
            .map((x) => {
                return produce(x, (draft) => {
                    draft.actions = draft.actions.map((action) => {
                        const nft = nfts.find(
                            (x) => x.tokenId === action.token_id && isSameAddress(x.address, action.contract_address),
                        );
                        if (nft)
                            action.nft = {
                                ...nft,
                                hasBookmarked: bookmarks?.find(
                                    (x) => x.post_id.toLowerCase() === resolveNFTIdFromAsset(nft),
                                )?.has_book_marked,
                            };
                        return action;
                    });
                });
            })
            .filter((x) => compact(x.actions.map((action) => action.nft)).length);
        return createPageable(
            data,
            indicator,
            response.data.cursor && data.length > 0 ? createIndicator(undefined, response.data.cursor) : undefined,
        );
    }

    async getBlockRelation(conditions: Array<{ snsPlatform: FireflyPlatform; snsId: string }>) {
        return fireflySessionHolder.withSession(async (session) => {
            if (!session) return [];
            const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/blockRelation');
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
        // TODO firefly doesn't support this
        if ([FireflyPlatform.Bsky, FireflyPlatform.Twitter, FireflyPlatform.Lens].includes(platform)) {
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
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet/twitter/wallet/report');

        await fireflySessionHolder.fetch<EmptyResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                twitterId: connection.twitterId,
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
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing: 'all',
                chains: chains.length ? chains.join(',') : undefined,
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

    async getSwapTimelineByAddress(address: string | string[], chains: number[], indicator?: PageIndicator) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/swap');
        const response = await fireflySessionHolder.fetch<SwapActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                walletAddresses: Array.isArray(address) ? address : [address],
                chains: chains.length ? chains.join(',') : undefined,
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

    async getTokenByCoinId(coinId: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, 'v1/token/single_coins', {
            coingecko_id: coinId,
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

        return createPageable(data.list ?? EMPTY_LIST, createIndicator(undefined));
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
        return data;
    }

    async getSponsorMintStatus(options: SponsorMintOptions) {
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
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/detect', {
            address,
            chainId,
        });
        const response = await fireflySessionHolder.fetch<DetectAddressResponse>(url, { method: 'GET' });

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
}

export const FireflyEndpointProvider = new FireflyEndpoint();
