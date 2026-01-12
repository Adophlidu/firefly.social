/* cspell:disable */

import { NotImplementedError } from '@dimensiondev/utils';
import { sortBy, toInteger, uniqBy } from 'lodash-es';
import urlcat from 'urlcat';
import { toHex } from 'viem';

import { Source } from '@/constants/enum.js';
import { MessageType, ReactionType } from '@/constants/farcaster.js';
import { MAX_IMAGE_SIZE_PER_POST, MAX_IMAGE_SIZE_PRO_PER_POST } from '@/constants/limitation.js';
import { URL_REGEX } from '@/constants/regexp.js';
import { EMPTY_LIST, NEYNAR_URL } from '@/constants/static.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import { fixUrlProtocol } from '@/helpers/fixUrlProtocol.js';
import { isYouTubeUrl } from '@/helpers/isYouTubeUrl.js';
import { normalizeUrl } from '@/helpers/normalizeUrl.js';
import { type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { farcasterPostIdToHash } from '@/providers/farcaster/farcasterPostIdToHash.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { getAllMentionsForFarcaster } from '@/providers/farcaster/getAllMentionsForFarcaster.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';
import { searchProfiles } from '@/providers/neynar/searchProfiles.js';
import { type Account } from '@/providers/types/Account.js';
import {
    type Channel as FireflyChannel,
    type NotificationSettings,
    type WalletProfile,
} from '@/providers/types/Firefly.js';
import { type CastResponse } from '@/providers/types/Neynar.js';
import { type Session } from '@/providers/types/Session.js';
import {
    type Channel,
    type Friendship,
    type NetworkType,
    type Notification,
    type Post,
    type Profile,
    type ProfileBadge,
    type ProfileEditable,
    type ProfileForSignup,
    type Provider,
    SessionType,
} from '@/providers/types/SocialMedia.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';

class NeynarSocialMedia implements Provider {
    getChannelTrendingPosts(channel: Channel, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelMembers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    async getChannelFollowers(channelId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    blockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedWallets(indicator?: PageIndicator): Promise<Pageable<WalletProfile, PageIndicator>> {
        throw new NotImplementedError();
    }

    watchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    unwatchWallet(address: string, networkType?: NetworkType): Promise<boolean> {
        throw new NotImplementedError();
    }

    reportChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getFriendship(profileId: string): Promise<Friendship | null> {
        throw new NotImplementedError();
    }

    async mirrorPost(postId: string, authorId?: number): Promise<string> {
        if (!authorId) throw new Error('Failed to recast post');

        await publishMessage(() => ({
            type: MessageType.REACTION_ADD,
            reactionBody: {
                type: ReactionType.RECAST,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        }));
        // FIXME: should return post id here
        return null!;
    }

    async unmirrorPost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to unmirror post.');

        await publishMessage(() => ({
            type: MessageType.REACTION_REMOVE,
            reactionBody: {
                type: ReactionType.RECAST,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        }));
    }

    async quotePost(postId: string, post: Post, authorId?: number): Promise<{ postId: string }> {
        const result = await getAllMentionsForFarcaster(post.metadata.content?.content ?? '');
        if (!postId || !post || !authorId) throw new Error('Failed to quote post.');

        const { hash } = await publishMessage<CastResponse>(() => ({
            type: MessageType.CAST_ADD,
            castAddBody: {
                ...result,
                embedsDeprecated: EMPTY_LIST,
                embeds: [
                    {
                        castId: {
                            fid: authorId,
                            hash: farcasterPostIdToHash(postId),
                        },
                    },
                    ...(post.mediaObjects?.map((v) => ({ url: v.url })) ?? []),
                ],
                parentCastId:
                    post.commentOn?.postId && post.commentOn?.author.profileId
                        ? {
                              fid: toInteger(post.commentOn.author.profileId),
                              hash: farcasterPostIdToHash(post.commentOn.postId),
                          }
                        : undefined,
                parentUrl:
                    !(post.commentOn?.postId && post.commentOn?.author.profileId) && post.parentChannelUrl
                        ? post.parentChannelUrl
                        : undefined,
            },
        }));
        return { postId: toHex(new Uint8Array(hash.data)) };
    }

    collectPost(postId: string, collectionId?: string): Promise<void> {
        throw new NotImplementedError();
    }

    isFollowedByMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    isFollowingMe(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    async commentPost(postId: string, post: Post): Promise<{ postId: string }> {
        return this.publishPost(post);
    }

    async deletePost(postId: string): Promise<boolean> {
        await publishMessage(() => ({
            type: MessageType.CAST_REMOVE,
            castRemoveBody: {
                targetHash: farcasterPostIdToHash(postId),
            },
        }));
        return true;
    }

    getChannelById(channelId: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    getChannelByHandle(channelHandle: string): Promise<Channel> {
        throw new NotImplementedError();
    }

    getChannelsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByChannelId(channelId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByChannelHandle(channelHandle: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getHiddenComments(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    actPost(postId: string, options: unknown): Promise<void> {
        throw new NotImplementedError();
    }

    getCollectedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikedPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getRepliesPostsByProfileId(profileId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async publishPost(post: Post): Promise<{ postId: string }> {
        const result = await getAllMentionsForFarcaster(post.metadata.content?.content ?? '');

        const urls = post.metadata.content?.content?.match(URL_REGEX) || EMPTY_LIST;
        const mediaUrls = post.mediaObjects?.map((v) => ({ url: v.url })) ?? [];
        const hasRp = !!post.metadata.rpPayload;
        const contentUrls = !hasRp
            ? sortBy(urls, (x) => (isYouTubeUrl(x) ? -1 : 0)).map((url) => ({
                  url: fixUrlProtocol(url),
              }))
            : EMPTY_LIST;

        // To refresh to pro status
        const state = useFarcasterProfileStore.getState();
        await state.refreshCurrentAccount();
        const imageCountLimit = state.currentProfile?.isProUser
            ? MAX_IMAGE_SIZE_PRO_PER_POST[Source.Farcaster]
            : MAX_IMAGE_SIZE_PER_POST[Source.Farcaster];

        // contentUrls might contain urls that already included in mediaUrls. see fw-5498
        const embeds = uniqBy([...mediaUrls, ...contentUrls], (x) => normalizeUrl(x.url.toLowerCase())).slice(
            0,
            imageCountLimit,
        );
        const { hash } = await publishMessage<CastResponse>(() => ({
            type: MessageType.CAST_ADD,
            castAddBody: {
                ...result,
                embedsDeprecated: [],
                embeds,
                parentCastId:
                    post.commentOn?.postId && post.commentOn?.author.profileId
                        ? {
                              fid: toInteger(post.commentOn.author.profileId),
                              hash: farcasterPostIdToHash(post.commentOn.postId),
                          }
                        : undefined,
                parentUrl:
                    !(post.commentOn?.postId && post.commentOn?.author.profileId) && post.parentChannelUrl
                        ? post.parentChannelUrl
                        : undefined,
            },
        }));
        return { postId: toHex(new Uint8Array(hash.data)) };
    }

    async upvotePost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to upvote post.');

        await publishMessage(() => ({
            type: MessageType.REACTION_ADD,
            reactionBody: {
                type: ReactionType.LIKE,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        }));
    }

    async unvotePost(postId: string, authorId?: number): Promise<void> {
        if (!authorId) throw new Error('Failed to unvote post.');

        await publishMessage(() => ({
            type: MessageType.REACTION_REMOVE,
            reactionBody: {
                type: ReactionType.LIKE,
                targetCastId: {
                    fid: authorId,
                    hash: farcasterPostIdToHash(postId),
                },
            },
        }));
    }

    getProfileByHandle(handle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    getProfileBySession(session: Session): Promise<Profile> {
        throw new NotImplementedError();
    }

    getPostById(postId: string): Promise<Post> {
        throw new NotImplementedError();
    }

    getCommentsById(postId: string): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPosts(): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    discoverPostsById(profileId: string): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsByProfileId(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsBeMentioned(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsLiked(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getPostsReplies(profileId: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    async follow(profileId: string): Promise<boolean> {
        await publishMessage(() => ({
            type: MessageType.LINK_ADD,
            linkBody: {
                type: 'follow',
                targetFid: Number(profileId),
            },
        }));
        return true;
    }

    async unfollow(profileId: string): Promise<boolean> {
        await publishMessage(() => ({
            type: MessageType.LINK_REMOVE,
            linkBody: {
                type: 'follow',
                targetFid: Number(profileId),
            },
        }));
        return true;
    }

    getFollowers(profileId: string): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getFollowings(profileId: string): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    getMutualFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getNotifications(): Promise<Pageable<Notification>> {
        throw new NotImplementedError();
    }

    async getNotificationSettings(): Promise<NotificationSettings> {
        throw new NotImplementedError();
    }

    async setNotificationSettings(settings: NotificationSettings): Promise<boolean> {
        throw new NotImplementedError();
    }

    getSuggestedFollows(): Promise<Pageable<Profile>> {
        throw new NotImplementedError();
    }

    searchPosts(q: string): Promise<Pageable<Post>> {
        throw new NotImplementedError();
    }

    getThreadByPostId(postId: string): Promise<Post[]> {
        throw new NotImplementedError();
    }

    blockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedProfiles(indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    blockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unblockChannel(channelId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
        throw new NotImplementedError();
    }

    getLikeReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getRepostReactors(postId: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
        throw new NotImplementedError();
    }

    getPostsQuoteOn(postId: string, indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    bookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    unbookmark(postId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    getBookmarks(indicator?: PageIndicator): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    reportProfile(profileId: string): Promise<boolean> {
        throw new NotImplementedError();
    }

    reportPost(post: Post): Promise<boolean> {
        throw new NotImplementedError();
    }

    async updateProfile(profile: ProfileEditable): Promise<boolean> {
        throw new NotImplementedError();
    }

    getProfileBadges(profile: Profile): Promise<ProfileBadge[]> {
        throw new NotImplementedError();
    }

    get type() {
        return SessionType.Farcaster;
    }

    getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getProfileById(profileId: string): Promise<Profile> {
        throw new NotImplementedError();
    }

    async getProfilesByIds(ids: string[]): Promise<Profile[]> {
        throw new NotImplementedError();
    }

    async getChannelsByIds(ids: string[]): Promise<Channel[]> {
        if (!ids.length) return EMPTY_LIST;

        return farcasterSessionHolder.withSession(async (session) => {
            const url = urlcat(NEYNAR_URL, '/v2/farcaster/channel/bulk', {
                ids: ids.join(','),
                viewer_fid: session?.profileId,
            });

            const response = await fetchNeynarJson<{ channels: FireflyChannel[] }>(url);
            const data = resolveNeynarResponseData(response);
            return data.channels.map(formatChannelFromFirefly);
        });
    }

    async searchProfiles(q: string, indicator?: PageIndicator) {
        return searchProfiles(q, indicator);
    }

    async joinChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async leaveChannel(channel: Channel): Promise<boolean> {
        throw new NotImplementedError();
    }

    async getPinnedPost(profileId: string): Promise<Post | null> {
        throw new NotImplementedError();
    }

    async decryptPost(post: Post): Promise<Post> {
        throw new NotImplementedError();
    }

    async getMediaPostsByProfileId(
        profileId: string,
        indicator?: PageIndicator,
    ): Promise<Pageable<Post, PageIndicator>> {
        throw new NotImplementedError();
    }

    async createAccount(profile: ProfileForSignup): Promise<Account> {
        throw new NotImplementedError();
    }
}

export { NeynarSocialMedia };
export const neynarSocialMediaProvider = new NeynarSocialMedia();
